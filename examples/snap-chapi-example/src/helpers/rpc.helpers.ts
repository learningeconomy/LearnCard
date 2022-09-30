import { sendRequest as _sendRequest } from '@learncard/meta-mask-snap';
import { snapId } from '@constants/snapConstants';

export const sendRequest: typeof _sendRequest = params => _sendRequest(params, snapId);
