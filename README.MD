<h1 align="center">Welcome to rjweb-server-ratelimit 👋</h1>
<div align="center">
  A rjweb-server Middleware to add rate limits
</div>

## Install

```sh
npm i rjweb-server-ratelimit
```

or

```sh
yarn add rjweb-server-ratelimit
```

or

```sh
pnpm add rjweb-server-ratelimit
```

## Add Intellisense (Important for good developer experience!)
```ts
// webserver.d.ts

import { MiddlewareToProps } from "rjweb-server"
import { Props as AdditionalProps1 } from "rjweb-server-ratelimit"

declare module "rjweb-server" {
  export interface HTTPRequestContext extends MiddlewareToProps<[ AdditionalProps1 ]> {}
}
```

## Usage

Setting a RateLimit on a Path
```js
const { Server } = require('rjweb-server')
const ratelimit = require('rjweb-server-ratelimit')

const server = new Server({
  port: 8000
})

server.middleware(ratelimit.init({
  http: {
    message: 'Over the limit!!',
    rules: [
      {
        path: '/api',
        ignore: '/api/version',
        timeWindow: 30000,
        maxHits: 5
      }
    ]
  }
}))

server.path('/api', (path) => path
  .http('GET', '/', (ctr) => {
    const limit = ctr.getRateLimits()[0]

    ctr.print(`You have used ${limit.hits} / ${limit.max} of your limits, they will be reset in ${limit.resetIn}ms`)
  })
)

server.start().then((res) => {
  console.log(`Server started on port ${res.port}`)
})
```

Using Regex
```js
const { Server } = require('rjweb-server')
const ratelimit = require('rjweb-server-ratelimit')

const server = new Server({
  port: 8000
})

server.middleware(ratelimit.init({
  http: {
    message: 'Over the limit!!',
    rules: [
      {
        path: /api|auth/g,
        timeWindow: 30000,
        maxHits: 5
      }
    ]
  }
}))

server.path('/api', (path) => path
  .http('GET', '/', (ctr) => {
    const limit = ctr.getRateLimits()[0]

    ctr.print(`You have used ${limit.hits} / ${limit.max} of your limits, they will be reset in ${limit.resetIn}ms`)
  })
)

server.start().then((res) => {
  console.log(`Server started on port ${res.port}`)
})
```

Match with Arrays
### Now if any of the paths in that array match it will apply the ratelimit
```js
const { Server } = require('rjweb-server')
const ratelimit = require('rjweb-server-ratelimit')

const server = new Server({
  port: 8000
})

server.middleware(ratelimit.init({
  http: {
    message: 'Over the limit!!',
    rules: [
      {
        path: [/api|auth/g, '/stats'],
        timeWindow: 30000,
        maxHits: 5
      }
    ]
  }
}))

server.path('/api', (path) => path
  .http('GET', '/', (ctr) => {
    const limit = ctr.getRateLimits()[0]

    ctr.print(`You have used ${limit.hits} / ${limit.max} of your limits, they will be reset in ${limit.resetIn}ms`)
  })
)

server.start().then((res) => {
  console.log(`Server started on port ${res.port}`)
})
```

## Author

👤 **0x4096** 

## Show your support

Give a Star if this project helped you!

## 📝 License

Copyright © 2023 0x4096.<br />
This project is MIT licensed.