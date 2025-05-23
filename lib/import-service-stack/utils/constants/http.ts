// these should be moved outside, since they are global, but wasn't sure how do achieve that, since it wasn't included in the cdk.out folder

export const COMMON_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'OPTIONS,POST,GET,PUT',
};

export const enum STATUS_CODES {
  OK = 200,
  CREATED = 201,
  NOT_FOUND = 404,
  SERVER_ERROR = 500,
}
