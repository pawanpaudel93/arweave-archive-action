<h1 align="center">arweave-archive-action</h1>
<p align="center">Archive single page html and screenshot of websites and save to Arweave.</p>

<p align="center">
  <a href="https://github.com/pawanpaudel93/arweave-archive-action/actions"><img alt="arweave-archive-action status" src="https://github.com/pawanpaudel93/arweave-archive-action/workflows/arweave-archive-action/badge.svg"></a>
</p>

## Example usage

```yaml
name: arweave-archive-action
on: [push]
jobs:
  capture:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: |
          sudo apt-get update
          sudo apt-get install -y libgconf-2-4 libatk1.0-0 libatk-bridge2.0-0 libgdk-pixbuf2.0-0 libgtk-3-0 libgbm-dev libnss3-dev libxss-dev libasound2
      - name: Install Google Chrome
        uses: browser-actions/setup-chrome@latest
        with:
          chrome-version: stable
      - run: npm install https://github.com/pawanpaudel93/single-file-cli
      - name: Archive webpage and screenshot
        uses: pawanpaudel93/arweave-archive-action@v1.1.0
        with:
          jwk: ${{ secrets.JWK }}
          url_file_path: 'urls.txt'
          gateway_url: 'https://ar-io.net'
```

## Inputs

### `jwk`

**Required** Arweave wallet JWK

### `url_file_path`

**Required** File containing urls lines to capture.

### `output_file_path`

_Default_ `saved.json`

JSON file path to save the captured webpage information.

### `gateway_url`

_Default_ `https://arweave.net`

URL of the service used to access network data.

### `bundler_url`

_Default_ `https://node2.bundlr.network`

URL of the service used to submit data to the network when possible instead of using the gateway.

## Outputs

### `out`

JSON string of the captured webpage information.
e.g.  

```json
[
  {
    "title": "Arweave - A community-driven ecosystem",
    "url": "https://arweave.org/",
    "webpage": "https://arweave.net/WlG3iz__TfzMswJEQTHEqpMROIxuBAoaNG7owfhqwNM",
    "screenshot": "https://arweave.net/WlG3iz__TfzMswJEQTHEqpMROIxuBAoaNG7owfhqwNM/screenshot",
    "timestamp": 1683967277
  }
]
```

## Author

👤 **Pawan Paudel**

- Github: [@pawanpaudel93](https://github.com/pawanpaudel93)

## 🤝 Contributing

Contributions, issues and feature requests are welcome!<br />Feel free to check [issues page](https://github.com/pawanpaudel93/arweave-archive-action/issues).

## Show your support

Give a ⭐️ if this project helped you!

Copyright © 2023 [Pawan Paudel](https://github.com/pawanpaudel93).<br />
