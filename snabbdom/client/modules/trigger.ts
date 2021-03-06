import type {VNode, Module} from 'snabbdom'

export type Trigger = {
  focus: boolean;
  blur: boolean;
  select: boolean;
  copy: boolean;
  play: boolean;
  pause: boolean;
  stop: boolean;
  currentTime: number;
  srcObject: MediaStream;
  setSinkId: string;
}

const createOrUpdate = (oldVNode: VNode, vnode: VNode) => {
  if (!vnode.data) return;
  if (!vnode.data.trigger) return;
  const trigger: Trigger = vnode.data.trigger;
  const elm = vnode.elm as HTMLElement;

  if (trigger.focus !== undefined) {
    elm.focus({preventScroll: trigger.focus})
  }

  if (trigger.select !== undefined) {
    (elm as HTMLInputElement).select()
  }

  if (trigger.copy !== undefined) {
    (elm as HTMLInputElement).select();
    document.execCommand('copy');
  }

  if (trigger.srcObject !== undefined) {
    (elm as HTMLVideoElement).srcObject = trigger.srcObject;
  }

  if (trigger.play) {
    const res = (elm as HTMLMediaElement).play();
  }

  if (trigger.pause) {
    const res = (elm as HTMLMediaElement).pause();
  }

  if (trigger.stop) {
    ((elm as HTMLMediaElement)?.srcObject as MediaStream)?.getTracks()
      .forEach((track) =>
        track.stop())
  }

  if (trigger.currentTime !== undefined) {
    (elm as HTMLMediaElement).currentTime = trigger.currentTime;
  }

  if (trigger.setSinkId !== undefined) {
    // @ts-ignore
    elm.setSinkId(trigger.setSinkId);
  }

}

export const triggerModule: Module = {
  create: createOrUpdate,
  update: createOrUpdate
}


