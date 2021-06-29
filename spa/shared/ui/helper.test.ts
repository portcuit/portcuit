import test from 'ava'
import {flowEvent, jsonSearch} from "./helper";
import {updateBatchFromFlowEvent} from "../../frontend";


test('search', async () => {
  const str = flowEvent({flow:{changeLesson:{detail:{a: 'b'}}}});
  console.log(str);
  const batchUpdate = updateBatchFromFlowEvent({target: 'element'} as any, str);
  console.log(JSON.stringify(batchUpdate, undefined, 2));
})
