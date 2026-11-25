export const sheetPaths = {
  create: (lockerId: number) => `/casiers/${lockerId}/fiches/nouvelle`,
  read: (sheetId: number) => `/fiches/${sheetId}`,
  edit: (sheetId: number) => `/fiches/${sheetId}/modifier`,
};
