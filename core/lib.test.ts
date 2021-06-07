import test from 'ava'
import assert from 'assert'
import {PrivateSocket, isSocket, Socket} from "@pkit/core";

test('test', async () => {

  console.log('???', new PrivateSocket);

  const sock = new PrivateSocket<{a: string}>();
  // assert(isSocket(sock) === true)
  console.log(sock instanceof Socket);
  console.log(sock instanceof PrivateSocket);


  // const X = () => true
  // console.log('name:', X.name)

  // console.log(sock);

})