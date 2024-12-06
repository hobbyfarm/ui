import {
  BlobReader,
  BlobWriter,
  Client,
  InputStream,
  StringReader,
  StringWriter,
} from 'guacamole-common-js';
import { Mimetype } from 'guacamole-common-js/lib/GuacCommon';
import { ClipboardCache } from './ClipboardCache';

class GuacClipboard {
  public remoteClipboard: ClipboardCache = {
    mimetype: 'text/plain',
    data: '',
  };

  public cache: ClipboardCache | undefined;

  install(client: Client) {
    this.getLocalClipboard().then(
      (data: ClipboardCache | undefined) => (this.cache = data),
    );

    window.addEventListener('load', this.update(client), true);
    window.addEventListener('copy', this.update(client));
    window.addEventListener('cut', this.update(client));
    window.addEventListener(
      'focus',
      (e) => {
        if (e.target === window) {
          this.update(client)();
        }
      },
      true,
    );
  }

  update(client: Client) {
    return () => {
      this.getLocalClipboard().then((data: ClipboardCache | undefined) => {
        this.cache = data;
        this.setRemoteClipboard(client);
      });
    };
  }

  setRemoteClipboard(client: Client) {
    if (!this.cache) {
      return;
    }

    let writer: StringWriter | BlobWriter;

    const stream = client.createClipboardStream(this.cache.mimetype);

    if (typeof this.cache.data === 'string') {
      writer = new StringWriter(stream);
      writer.sendText(this.cache.data);
      writer.sendEnd();
    } else {
      writer = new BlobWriter(stream);
      writer.oncomplete = function clipboardSent() {
        writer.sendEnd();
      };
      writer.sendBlob(this.cache.data);
    }

    this.remoteClipboard = {
      mimetype: this.cache.mimetype,
      data: this.cache.data,
    };
  }

  private async getLocalClipboard(): Promise<ClipboardCache | undefined> {
    if (navigator.clipboard && navigator.clipboard.readText) {
      const text = await navigator.clipboard.readText();
      return {
        mimetype: 'text/plain',
        data: text,
      };
    }
    return;
  }

  async setLocalClipboard(clipboardData: ClipboardCache) {
    if (
      navigator.clipboard &&
      clipboardData.mimetype === 'text/plain' &&
      typeof clipboardData.data === 'string'
    ) {
      await navigator.clipboard.writeText(clipboardData.data);
    }
  }

  onClipboard(clipboardStream: InputStream, mimetype: Mimetype): void {
    if (/^text\//.exec(mimetype)) {
      const reader = new StringReader(clipboardStream);

      // Assemble received data into a single string
      let data = '';
      reader.ontext = (text: string) => {
        data += text;
      };

      // Set clipboard contents once stream is finished
      reader.onend = () => {
        const clipboardObj: ClipboardCache = {
          mimetype: mimetype,
          data: data,
        };
        this.setLocalClipboard(clipboardObj);
        this.remoteClipboard = clipboardObj;
      };
    } else {
      const reader = new BlobReader(clipboardStream, mimetype);
      reader.onend = () => {
        const clipboardObj = {
          mimetype: mimetype,
          data: reader.getBlob(),
        };
        this.setLocalClipboard(clipboardObj);
        this.remoteClipboard = clipboardObj;
      };
    }
  }
}

export default new GuacClipboard();
