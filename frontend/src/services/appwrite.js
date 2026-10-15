import { Account, Client, ID } from 'appwrite'

const endpoint = import.meta.env.VITE_APPWRITE_ENDPOINT
const projectId = import.meta.env.VITE_APPWRITE_PROJECT_ID

const client = new Client()
if (endpoint) {
  client.setEndpoint(endpoint)
}
if (projectId) {
  client.setProject(projectId)
}

const account = new Account(client)

const ensureConfigured = () => {
  if (!endpoint || !projectId) {
    throw new Error(
      'Missing Appwrite setup. Configure VITE_APPWRITE_ENDPOINT and VITE_APPWRITE_PROJECT_ID in frontend/.env.',
    )
  }
}

export const registerUser = async (name, email, password) => {
  ensureConfigured()
  await account.create(ID.unique(), email, password, name)
  await account.createEmailPasswordSession(email, password)
  return account.get()
}

export const loginWithEmail = async (email, password) => {
  ensureConfigured()
  await account.createEmailPasswordSession(email, password)
  return account.get()
}

export const getCurrentUser = async () => {
  ensureConfigured()
  return account.get()
}

export const getAuthToken = async () => {
  ensureConfigured()
  const { jwt } = await account.createJWT()
  return jwt
}

export const logoutUser = async () => {
  ensureConfigured()
  await account.deleteSession('current')
}
