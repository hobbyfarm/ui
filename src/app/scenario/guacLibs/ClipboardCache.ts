import { Mimetype } from 'guacamole-common-js/lib/GuacCommon';

export class ClipboardCache {
  mimetype: Mimetype;
  data: string | Blob;
}
