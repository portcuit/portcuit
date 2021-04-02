import Pkit, {FC} from "@pkit/snabbdom";
import {NextCsrState} from "../state";

export const CsrHeaderView: FC<NextCsrState> = (state) =>
  <>
    <script id="state" type="application/json" innerHTML={JSON.stringify(state)} />
    <script type="module" src={state.csr.docRoot + state.csr.entrypoint} defer />
  </>
