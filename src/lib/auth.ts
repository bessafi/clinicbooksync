export const getAuthToken = (): string | null => {
  return localStorage.getItem('jwt');
};

export const setAuthToken = (token: string): void => {
  localStorage.setItem('jwt', token);
};

export const removeAuthToken = (): void => {
  localStorage.removeItem('jwt');
};

export const isAuthenticated = (): boolean => {
  return !!getAuthToken();
};
