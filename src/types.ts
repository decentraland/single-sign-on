export enum Action {
  GET = "get",
  STORE = "store",
  CLEAR = "clear",
}

export type Payload = {
  target?: any;
  id?: any;
  action?: any;
  user?: any;
  identity?: any;
};

export type PostMessageExtraArgs = {
  identity?: string | null;
  error?: string;
};
