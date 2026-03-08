
const DRIVE_FILE_NAME = 'tevolta_cloud_db.json';
const FOLDER_NAME = 'Tevolta_Database';
const INVOICES_FOLDER_NAME = 'Invoices';

/**
 * Finds or creates a specific folder.
 */
async function findOrCreateFolder(accessToken: string, folderName: string, parentId?: string, sharedDriveId?: string): Promise<string> {
  let query = `name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`;
  if (parentId) {
    query += ` and '${parentId}' in parents`;
  } else if (sharedDriveId) {
    query += ` and '${sharedDriveId}' in parents`;
  }

  const searchParams = new URLSearchParams({
    q: query,
    fields: 'files(id, name)',
    includeItemsFromAllDrives: 'true',
    supportsAllDrives: 'true',
  });

  if (sharedDriveId) {
    searchParams.append('corpora', 'drive');
    searchParams.append('driveId', sharedDriveId);
  } else {
    searchParams.append('corpora', 'allDrives');
  }

  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files?${searchParams.toString()}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  
  const result = await response.json();
  if (result.files && result.files.length > 0) {
    return result.files[0].id;
  }

  const metadata: any = {
    name: folderName,
    mimeType: 'application/vnd.google-apps.folder',
  };

  if (parentId) {
    metadata.parents = [parentId];
  } else if (sharedDriveId) {
    metadata.parents = [sharedDriveId];
  }

  const createResponse = await fetch(
    'https://www.googleapis.com/drive/v3/files?supportsAllDrives=true',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(metadata)
    }
  );
  const createResult = await createResponse.json();
  return createResult.id;
}

/**
 * Finds or creates the database file.
 */
export const findOrCreateDriveFile = async (accessToken: string, sharedDriveId?: string) => {
  const folderId = await findOrCreateFolder(accessToken, FOLDER_NAME, undefined, sharedDriveId);

  const searchParams = new URLSearchParams({
    q: `name='${DRIVE_FILE_NAME}' and '${folderId}' in parents and trashed=false`,
    fields: 'files(id, name)',
    includeItemsFromAllDrives: 'true',
    supportsAllDrives: 'true',
  });

  if (sharedDriveId) {
    searchParams.append('corpora', 'drive');
    searchParams.append('driveId', sharedDriveId);
  }

  const searchResponse = await fetch(
    `https://www.googleapis.com/drive/v3/files?${searchParams.toString()}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  
  const searchResult = await searchResponse.json();

  if (searchResult.files && searchResult.files.length > 0) {
    return searchResult.files[0].id;
  }

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
        parents: [folderId],
        description: 'Tevolta Enterprise Shared Database'
      })
    }
  );
  const createResult = await createResponse.json();
  return createResult.id;
};

export const uploadInvoiceHtml = async (accessToken: string, fileName: string, htmlContent: string, sharedDriveId?: string) => {
  const rootFolderId = await findOrCreateFolder(accessToken, FOLDER_NAME, undefined, sharedDriveId);
  const invoicesFolderId = await findOrCreateFolder(accessToken, INVOICES_FOLDER_NAME, rootFolderId, sharedDriveId);

  const metadata = {
    name: fileName,
    mimeType: 'text/html',
    parents: [invoicesFolderId]
  };

  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  form.append('file', new Blob([htmlContent], { type: 'text/html' }));

  const response = await fetch(
    `https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&supportsAllDrives=true`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}` },
      body: form
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to archive invoice');
  }
  return await response.json();
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
    throw new Error(error.error?.message || 'Failed to upload to Shared Workspace');
  }
  return await response.json();
};

export const downloadFromDrive = async (accessToken: string, fileId: string) => {
  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media&supportsAllDrives=true`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  
  if (!response.ok) {
    if (response.status === 404) return null;
    throw new Error('Failed to download from Shared Workspace');
  }
  return await response.json();
};
