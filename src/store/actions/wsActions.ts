import * as types from './index';

export const WSMaintenanceAction = (maintenance: boolean) => {
  return {
    type: types.WS_MAINTENANCE,
    maintenance,
  };
};
