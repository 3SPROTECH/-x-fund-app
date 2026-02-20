export const ROLE_BASE_PATHS = {
  administrateur: '/admin',
  investisseur: '/investor',
  porteur_de_projet: '',
};

export function getRoleBasePath(role) {
  return ROLE_BASE_PATHS[role] || '/';
}

export function getRoleHomePath(role) {
  const basePath = getRoleBasePath(role);
  return basePath === '/' ? '/' : `${basePath}/dashboard`;
}

export function withRolePath(role, path = '') {
  const basePath = getRoleBasePath(role);
  if (basePath === '/' || basePath === '') return path ? `/${path.replace(/^\/+/, '')}` : '/';
  if (!path) return basePath;
  return `${basePath}/${path.replace(/^\/+/, '')}`;
}
