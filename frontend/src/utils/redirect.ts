export function getRedirectPath(user: any) {
    return user?.user_role?.slug === "admin"
      ? "/multitenant-manager"
      : "/dashboard";
  }
  