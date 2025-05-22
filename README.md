
## Run tasks

To run the dev server for your app, use:

```sh
nx serve api-server 
```

To serve teh front-end use: 
```sh
nx serve front-end
```

To create a production bundle:

```sh
nx build front-end
```

To run both the `api-server` and `front-end` at the same time run: 
```sh
nx run-many -t serve --projects=api-server,front-end
```
