# Sample Hardhat Project

This project demonstrates a basic Hardhat use case. It comes with a sample contract, a test for that contract, and a script that deploys that contract.

Try running some of the following tasks:

To start plugin development, run this command
```shell
cd wp-content/plugins/sharedoc-ai
npm start
```

To commit and push the changes from plugin.
Do not run npm start before adding into repository
```shell
npm run build
git add .
git commit -m 'your message'
git push
```

To start theme development, run this command
```shell
cd wp-content/themes/sharedoc/assets
sass --watch scss/style.scss:css/style.css
```



To start blockchain developent, run this command
```shell
npx hardhat help
npx hardhat test
REPORT_GAS=true npx hardhat test
npx hardhat node
npx hardhat run scripts/deploy.js
```
