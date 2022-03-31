import Guacamole from 'guacamole-common-js'

const clipboard: any = {}

clipboard.remoteClipboard = {
  type: "text/plain",
  data: ""
};

clipboard.install = (client: any) => {
  clipboard.getLocalClipboard().then((data: any) => clipboard.cache = data)

  window.addEventListener('load', clipboard.update(client), true)
  window.addEventListener('copy', clipboard.update(client))
  window.addEventListener('cut', clipboard.update(client))
  window.addEventListener('focus', e => {
    if (e.target === window) {
      clipboard.update(client)()
    }
  }, true)
}

clipboard.update = (client: any) => {
  return () => {
    clipboard.getLocalClipboard().then((data: any) => {
    clipboard.cache = data
    clipboard.setRemoteClipboard(client)
  });
  }
}

clipboard.setRemoteClipboard = (client: { createClipboardStream: (arg0: any) => any; }) => {
  if (!clipboard.cache) {
    return
  }

  let writer: Guacamole.StringWriter | Guacamole.BlobWriter

  const stream = client.createClipboardStream(clipboard.cache.type)

  if (typeof clipboard.cache.data === 'string') {
    writer = new Guacamole.StringWriter(stream)
    writer.sendText(clipboard.cache.data)
    writer.sendEnd()
  } else {
    writer = new Guacamole.BlobWriter(stream)
    writer.oncomplete = function clipboardSent() {
      writer.sendEnd()
    };
    writer.sendBlob(clipboard.cache.data)
  }

  clipboard.remoteClipboard = ({type: clipboard.cache.type, data: clipboard.cache.data});
}

clipboard.getLocalClipboard = async () => {
  if (navigator.clipboard && navigator.clipboard.readText) {
    const text = await navigator.clipboard.readText()
    return {
      type: 'text/plain',
      data: text
    }
  }
  return;
}

clipboard.setLocalClipboard = async (data: { type: string; data: string; }) => {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    if (data.type === 'text/plain') {
      await navigator.clipboard.writeText(data.data)
    }
  }
}

clipboard.onClipboard = (stream: Guacamole.InputStream, mimetype: string) => {
  let reader: Guacamole.StringReader | Guacamole.BlobReader

  if (/^text\//.exec(mimetype)) {
    reader = new Guacamole.StringReader(stream);

    // Assemble received data into a single string
    let data = '';
    reader.ontext = text => {
      data += text;
    }

    // Set clipboard contents once stream is finished
    reader.onend = () => {
      let clipboardObj = {
        type: mimetype,
        data: data
      };
      clipboard.setLocalClipboard(clipboardObj);
      clipboard.remoteClipboard = clipboardObj;
    }
  } else {
    reader = new Guacamole.BlobReader(stream, mimetype);
    reader.onend = () => {
      let clipboardObj = {
        type: mimetype,
        data: (reader as Guacamole.BlobReader).getBlob()
      };
      clipboard.setLocalClipboard(clipboardObj)
      clipboard.remoteClipboard = clipboardObj;
    }
  }
}

export default clipboard