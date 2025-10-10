export function validateWalletAddress(address: string): boolean {
  // Sui wallet address validation (0x + 64 hex characters)
  const suiAddressRegex = /^0x[0-9a-fA-F]{64}$/;
  return suiAddressRegex.test(address);
}

export function validateDID(did: string): boolean {
  const didRegex = /^did:trustiq:sui:0x[0-9a-fA-F]{64}$/;
  return didRegex.test(did);
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validateUsername(username: string): boolean {
  // Basic username validation (3-30 characters, alphanumeric and underscores)
  const usernameRegex = /^[a-zA-Z0-9_]{3,30}$/;
  return usernameRegex.test(username);
}