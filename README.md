## これは何
オフラインでEvm系チェーンの署名を行うツール。Sepoliaでのみ検証。

## 使い方
### 依存をダウンロード、インストール
```sh
npm i
npm i -g ts-node
```

### TypeScriptをビルドおよび実行可能ファイルへシンボリックリンク作成
```sh
npm run build
chmod +x dist/cli.js

# /usr/local/bin にシンボリックリンクファイルを作成するのでsudo 権限が必要かも
# これを行わない場合、dist/cli.js を直接実行してください
npm link
```

### 動作確認
```sh
ethereum_exam
ethereum_exam greet
ethereum_exam sign -h
```

### secret_params.json を配置
```
{
  "mnemonic": "blah blah ... blah",
  "passphrase": "<passphrase>",
  "derivePath": "m/44'/60'/0'/0/0"
}
```

### private_request ディレクトリを作成
```sh
mkdir private_request
```

### request ファイルを作成
数量はwei、文字列指定。
typeは、EIP1559の場合は2を指定。

from は、mnemonic + derivePathから生成されるアドレスであることが必要。

例(フォーマット)
```
{
  "maxFeePerGas": "3000000000",
  "maxPriorityFeePerGas": "3000000000",
  "gasLimit": 21000,
  "from": "<your source address>",
  "to": "0x10Fb3dDc48495E708257f62e57E6576331ab2438",
  "value": "1000000000",
  "chainId": 11155111,
  "nonce": 0,
  "type": 2
}
```

### 署名
```
ethereum_exam sign --mode sign --output-format file --request-file ./private_request/request_1.json --dryrun-sign
```

### ブロードキャスト
コピーしてブロードキャスト

https://sepolia.etherscan.io/pushTx

## コマンドヘルプ
```
ethereum_exam -h

Usage: ethereum_exam [options] [command]

My simple CLI tool

Options:
  -V, --version    output the version number
  -h, --help       display help for command

Commands:
  greet [options]  Say hello
  sign [options]   Signs transaction.
  help [command]   display help for command
```

```
 ethereum_exam greet -h

Usage: ethereum_exam greet [options]

Say hello

Options:
  -n, --name <string>  Name to greet
  -h, --help           display help for command
```

```
ethereum_exam sign -h

Usage: ethereum_exam sign [options]

Signs transaction.

Options:
  --mode <string>           "dryrun" | "sign"
  --dryrun-sign             Validate params by doing sign. Only works when mode is "dryrun"
  --output-format <string>  "file" | "stdout". Default is "stdout".
  --secret-file <string>    Path to secret file. Default is "secret_params.json"
  --request-file <string>   Request file to sign.
  -h, --help                display help for command
```

