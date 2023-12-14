import abi from "./abi.js";

const contractAddress = "0xdB049fa95928E7425Df2Ee27828Ad09054791768";

let accounts, web3, myContract;

const accountsList = document.querySelector(".accounts_list");
const balanceAccount = document.querySelector(".balance_account");
const currentAccount = document.querySelector(".current_account");
const createOfferBTN = document.querySelector(".create_offer_btn");

const somebodyAddressInput = document.querySelector(".somebody_address");
const amountInput = document.querySelector(".amount");
const secretKeyInput = document.querySelector(".secret_key");
const transactionsContainer = document.querySelector(".transactions_container");


async function getAccounts() {
  web3 = new Web3(new Web3.providers.HttpProvider("HTTP://127.0.0.1:7545"));
  accounts = await web3.eth.getAccounts();

  for (let i = 0; i < accounts.length; i++) {
    let newOption = document.createElement("option");
    newOption.textContent = accounts[i];
    accountsList.append(newOption);
  }

  currentAccount.textContent = accounts[0];
  await updateBalanceAndTransfers(accounts[0]);

  accountsList.addEventListener("change", async (event) => {
    currentAccount.textContent = event.target.value;
    await updateBalanceAndTransfers(event.target.value);
  });

  return accounts;
}

async function updateBalanceAndTransfers(account) {
  const userBalance = await getBalance(account);
  balanceAccount.textContent = `${userBalance / 10 ** 18} eth`;
  await renderingTransfers(account);
}

async function getBalance(account) {
  const balance = await web3.eth.getBalance(account);
  return balance;
}

async function createOffer() {
  createOfferBTN.addEventListener("click", async () => {
    const somebodyAddress = somebodyAddressInput.value;
    const amount = amountInput.value;
    const secretKey = secretKeyInput.value;

    try {
      const transfer = await myContract.methods.create_offer(somebodyAddress, secretKey).send({
        from: currentAccount.textContent,
        value: web3.utils.toWei(amount, "ether"),
        gas: "6721965",
      });

      clearInputsCreateOffer();
      await updateBalanceAndTransfers(currentAccount.textContent);
      return transfer;
    } catch (error) {
      console.error(error);
    }
  });
}

async function renderingTransfers(selectedAccount) {
  const myContract = new web3.eth.Contract(abi, contractAddress);
  const transactions = await myContract.methods.getTransfers().call();

  transactionsContainer.innerHTML = "";

  for (const transaction of transactions) {
    if (!transaction.status) {
      continue;
    }

    if (selectedAccount === transaction.somebody || selectedAccount === transaction.owner) {
      const transactionItemDiv = document.createElement("div");
      transactionItemDiv.classList.add("transaction_container");

      const somebodyItem = document.createElement("p");
      somebodyItem.textContent = `Somebody: ${transaction.somebody}`;

      const amountItem = document.createElement("p");
      amountItem.textContent = `Amount: ${transaction.amount / 10 ** 18} eth`;

      const acceptOffer = document.createElement("button");
      acceptOffer.textContent = "Accept";
      acceptOffer.classList.add("accept_offer_btn");
      acceptOffer.id = `${transaction.transfer_id}`;
      
      const declineOffer = document.createElement("button");
      declineOffer.textContent = "Decline";
      declineOffer.classList.add("decline_offer_btn");
      declineOffer.id = `${transaction.transfer_id}`;

      acceptOffer.addEventListener("click", async () => {
        await handleAcceptOffer(transaction, selectedAccount);
      });
      
      declineOffer.addEventListener("click", async () => {
        await handleDeclineOffer(transaction, selectedAccount);
      });

      transactionItemDiv.append(somebodyItem, amountItem, acceptOffer, declineOffer);
      transactionsContainer.append(transactionItemDiv);
    }
  }
}

async function handleAcceptOffer(transaction, currentAccountValue) {
  let secretTransferKey = prompt("Input secret key");
  secretTransferKey = web3.utils.sha3(secretTransferKey);

  if (currentAccountValue === transaction.somebody) {
    await myContract.methods.accept_offer(transaction.transfer_id, secretTransferKey).send({
      from: currentAccountValue,
    });

    alert("Successfully accepted the offer and received the money");
  } else {
    alert("You are not the intended recipient of this transfer");
  }
  await updateBalanceAndTransfers(currentAccountValue);
}

async function handleDeclineOffer(transaction, currentAccountValue) {
  if (currentAccountValue === transaction.owner) {
    await myContract.methods.cancel_offer(transaction.transfer_id).send({
      from: currentAccountValue
    });
    alert("Transaction successfully canceled");
  } else {
    alert("You are not the owner of this transfer");
  }
  await updateBalanceAndTransfers(currentAccountValue);
}


function clearInputsCreateOffer() {
  somebodyAddressInput.value = "";
  amountInput.value = "";
  secretKeyInput.value = "";
}

async function main() {
  await getAccounts();
  myContract = new web3.eth.Contract(abi, contractAddress);
  createOffer();
}

main();
