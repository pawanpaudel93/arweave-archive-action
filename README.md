<h1 align="center">arweave-archive-action</h1>
<p align="center">Capture single page html and screenshot of websites and save to web3.storagem or moralis.</p>

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
          node-version: 18.16.0
      - run: |
          sudo apt-get update
          sudo apt-get install -y libgconf-2-4 libatk1.0-0 libatk-bridge2.0-0 libgdk-pixbuf2.0-0 libgtk-3-0 libgbm-dev libnss3-dev libxss-dev libasound2
      - name: Install Google Chrome
        uses: browser-actions/setup-chrome@latest
        with:
          chrome-version: stable
      - run: npm install https://github.com/pawanpaudel93/single-file-cli
      - name: Capture webpage and screenshot
        uses: pawanpaudel93/arweave-archive-action@v0.1.0
        with:
          web3_token: ${{ secrets.WEB3_TOKEN }}
          url_file_path: 'urls.txt'
          service: "moralis"
```

## Inputs

## Inputs

### `web3_token`

**Required** API token for web3.storage or moralis

### `url_file_path`

**Required** File containing urls lines to capture.

### `service`

**Required** Service type either `web3.storage` or `moralis` to upload the captured webpage, screenshot and metadata.

<details>
  <summary>Show advanced options: <code>outout_file_path</code>,  <code>web3_api</code></summary>

### `output_file_path`

_Default_ `saved.json`

JSON file path to save the captured webpage information.

### `web3_api`

_Default_ `https://api.web3.storage`

Useful for testing against staging deployments by setting to the api origin of your choice.

</details>

## Outputs

### `out`

JSON string of the captured webpage information.
e.g.  

```json
[
  {
    "title": "Web3 Storage - Simple file storage with IPFS & Filecoin",
    "url": "https://web3.storage",
    "cid": "bafybeiahtmydckvwwdjndstih5mmxdx2qixdcboki5i3fqzw7a2nwwmkx4",
    "w3link": "https://w3s.link/ipfs/bafybeiahtmydckvwwdjndstih5mmxdx2qixdcboki5i3fqzw7a2nwwmkx4",
    "timestamp": "Wed Sep 21 2022 20:36:13 GMT+0000 (Coordinated Universal Time)"
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

Copyright © 2022 [Pawan Paudel](https://github.com/pawanpaudel93).<br />
