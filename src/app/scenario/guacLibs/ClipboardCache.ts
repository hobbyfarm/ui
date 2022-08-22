import { Mimetype } from 'guacamole-common-js/lib/GuacCommon';

export interface ClipboardCache {
  mimetype: Mimetype;
  data: string | Blob;
}
