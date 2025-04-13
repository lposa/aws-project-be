// these should be moved outside, since they are global, but wasn't sure how do achieve that, since it wasn't included in the cdk.out folder

export const COMMON_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Origin': 'http://localhost:3000',
  'Access-Control-Allow-Methods': 'OPTIONS,POST,GET',
};

export const enum STATUS_CODES {
  OK = 200,
  NOT_FOUND = 404,
  SERVER_ERROR = 500,
}
