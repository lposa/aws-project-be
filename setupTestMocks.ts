export const mockSend = jest.fn();

export const mockDynamoClient = {
  send: mockSend,
};
