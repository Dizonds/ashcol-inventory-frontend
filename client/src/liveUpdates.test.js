import { TextDecoder, TextEncoder } from "util";
import { ReadableStream } from "stream/web";
import { subscribeToUpdates } from "./liveUpdates";

jest.mock("./api", () => ({ API_BASE: "/api" }));
global.TextDecoder = TextDecoder;
const encode = (value) => new TextEncoder().encode(value);
const flush = async () => { for (let i = 0; i < 12; i += 1) await Promise.resolve(); };

beforeEach(() => {
  jest.useFakeTimers();
  sessionStorage.setItem("ashcol_inventory_token", "test-login-token");
});
afterEach(() => { jest.useRealTimers(); sessionStorage.clear(); });

function streamResponse() {
  let controller;
  const body = new ReadableStream({ start(value) { controller = value; } });
  return { controller, response: { ok: true, status: 200, headers: new Headers({ "content-type": "text/event-stream" }), body } };
}

test("authenticated live events handle split frames and ignore heartbeat comments", async () => {
  const { controller, response } = streamResponse();
  const fetchImpl = jest.fn().mockResolvedValue(response);
  const onChange = jest.fn();
  const stop = subscribeToUpdates({ fetchImpl, onChange, onUnauthorized: jest.fn() });
  await flush();
  expect(fetchImpl).toHaveBeenCalledWith("/api/events", expect.objectContaining({ headers: { Authorization: "Bearer test-login-token", Accept: "text/event-stream" } }));
  controller.enqueue(encode("event: re"));
  controller.enqueue(encode('ady\r\ndata: {"revision":0}\r\n\r\n: heartbeat\n\nevent: change\ndata: {"revision":1}\n\n'));
  await flush();
  expect(onChange).toHaveBeenCalledTimes(2);
  stop();
  expect(fetchImpl.mock.calls[0][1].signal.aborted).toBe(true);
  controller.close();
  await flush();
  jest.advanceTimersByTime(5000);
  expect(fetchImpl).toHaveBeenCalledTimes(1);
});

test("a disconnected stream reconnects and requests a snapshot on ready", async () => {
  const first = streamResponse();
  const second = streamResponse();
  const fetchImpl = jest.fn().mockResolvedValueOnce(first.response).mockResolvedValueOnce(second.response);
  const onChange = jest.fn();
  const stop = subscribeToUpdates({ fetchImpl, onChange, onUnauthorized: jest.fn() });
  await flush();
  first.controller.close();
  await flush();
  jest.advanceTimersByTime(2000);
  await flush();
  expect(fetchImpl).toHaveBeenCalledTimes(2);
  second.controller.enqueue(encode('event: ready\ndata: {"revision":2}\n\n'));
  await flush();
  expect(onChange).toHaveBeenCalledTimes(1);
  stop();
  second.controller.close();
  await flush();
});

test("expired sessions stop reconnecting and sign out", async () => {
  const fetchImpl = jest.fn().mockResolvedValue({ status: 401 });
  const onUnauthorized = jest.fn();
  const stop = subscribeToUpdates({ fetchImpl, onChange: jest.fn(), onUnauthorized });
  await flush();
  expect(onUnauthorized).toHaveBeenCalledTimes(1);
  jest.advanceTimersByTime(10000);
  expect(fetchImpl).toHaveBeenCalledTimes(1);
  stop();
});
