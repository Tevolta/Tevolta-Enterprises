
const DRIVE_FILE_NAME = 'tevolta_cloud_db.json';

/**
 * Searches for the database file across all accessible drives (Private and Shared).
 * If not found, it creates a new one in the user's root.
 */
export const findOrCreateDriveFile = async (accessToken: string) => {
  // 1. Search for the file across all drives
  const searchParams = new URLSearchParams({
    q: `name='${DRIVE_FILE_NAME}' and trashed=false`,
    fields: 'files(id, name, owners, shared)',
    spaces: 'drive',
    supportsAllDrives: 'true',
    includeItemsFromAllDrives: 'true'
  });

  const searchResponse = await fetch(
    `https://www.googleapis.com/drive/v3/files?${searchParams.toString()}`,
    {
      headers: { Authorization: `Bearer ${accessToken}` }
    }
  );
  
  const searchResult = await searchResponse.json();

  if (searchResult.files && searchResult.files.length > 0) {
    // If multiple found, return the first one (most likely the shared one)
    return searchResult.files[0].id;
  }

  // 2. Create if not found (Only happens for the very first setup in the org)
  const createResponse = await fetch(
    'https://www.googleapis.com/drive/v3/files?supportsAllDrives=true',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: DRIVE_FILE_NAME,
        mimeType: 'application/json',
        description: 'Tevolta Organization Shared Database'
      })
    }
  );
  const createResult = await createResponse.json();
  return createResult.id;
};

export const uploadToDrive = async (accessToken: string, fileId: string, data: any) => {
  const metadata = {
    name: DRIVE_FILE_NAME,
    mimeType: 'application/json',
  };

  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  form.append('file', new Blob([JSON.stringify(data)], { type: 'application/json' }));

  const response = await fetch(
    `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=multipart&supportsAllDrives=true`,
    {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${accessToken}` },
      body: form
    }
  );

  if (!response.ok) {
    const error = await response.json();
    console.error("GDRIVE UPLOAD ERROR:", error);
    throw new Error('Failed to upload to Google Drive Shared Storage');
  }
  return await response.json();
};

export const downloadFromDrive = async (accessToken: string, fileId: string) => {
  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media&supportsAllDrives=true`,
    {
      headers: { Authorization: `Bearer ${accessToken}` }
    }
  );
  
  if (!response.ok) {
    if (response.status === 404) return null;
    throw new Error('Failed to download from Shared Google Drive');
  }
  return await response.json();
};
