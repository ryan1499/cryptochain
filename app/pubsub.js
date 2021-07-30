const PubNub = require('pubnub');

const credentials = {
    publishKey: 'pub-c-93889a57-629c-4512-8a85-589a9fe5a076',
    subscribeKey: 'sub-c-6618a38c-bfc7-11eb-aee1-fe487e55b6a4',
    secretKey: 'sub-c-6618a38c-bfc7-11eb-aee1-fe487e55b6a4'
};

const CHANNELS = {
    TEST: 'TEST', 
    BLOCKCHAIN: 'BLOCKCHAIN',
    TRANSACTION: 'TRANSACTION'
};

class PubSub {
    constructor({ blockchain, transactionPool, wallet }) {
        this.blockchain = blockchain;
        this.transactionPool = transactionPool;
        this.wallet = wallet;

        this.pubnub = new PubNub(credentials);

        this.pubnub.subscribe({ channels: Object.values(CHANNELS) })

        this.pubnub.addListener(this.listener());
        };

    listener() {
        return {
            message: messageObject => {
                const { channel, message } = messageObject;

                console.log(`Message received. Channel: ${channel}. Message: ${message}`);

                const parsedMessage = JSON.parse(message);

                switch(channel) {
                    case CHANNELS.BLOCKCHAIN:
                        this.blockchain.replaceChain(parsedMessage, true, () => {
                            this.transactionPool.clearBlockchainTransactions({
                                chain: parsedMessage
                            });
                        });
                        break;
                    case CHANNELS.TRANSACTION:
                        if (!this.transactionPool.existingTransaction({
                            inputAddress: this.wallet.publicKey
                        })) {
                            this.transactionPool.setTransaction(parsedMessage);
                        }
                        break;
                    default:
                        return;
                }
            }
        }
    }

    publish({ channel, message }) {
            this.pubnub.publish({ channel, message });
        }

    broadcastChain() {
        this.publish({
            channel: CHANNELS.BLOCKCHAIN,
            message: JSON.stringify(this.blockchain.chain)
        });
    }

    broadcastTransaction(transaction) {
        this.pubnub.publish({ 
            channel: CHANNELS.TRANSACTION, 
            message: JSON.stringify(transaction)
        });
    }
}

module.exports = PubSub;