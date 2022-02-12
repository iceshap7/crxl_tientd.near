use near_sdk::borsh::{self, BorshDeserialize, BorshSerialize};
use near_sdk::{env, near_bindgen, setup_alloc, AccountId, Promise};
use std::collections::HashMap;
use near_sdk::serde_json;
use near_sdk::serde::{Serialize, Deserialize};

setup_alloc!();

#[near_bindgen]
#[derive(BorshDeserialize, BorshSerialize)]
pub struct Review {
    records: HashMap<String, Message>,
    donations: u128,
    posts: u128,
}

#[derive(Deserialize, Serialize, BorshDeserialize, BorshSerialize)]
#[serde(crate = "near_sdk::serde")]
pub struct Message {
    image_link: String,
    company_name: String,
    company_address: String,
    your_quote: String,
    donation: u128,
    created_by: AccountId,
}

impl Default for Review {
  fn default() -> Self {
    Self {
      records: HashMap::new(),
      donations: 0,
      posts: 0,
    }
  }
}

#[near_bindgen]
impl Review {
    pub fn create(&mut self, id: String, mut message: Message) {
        let account_id = env::signer_account_id();
        message.created_by = account_id;

        self.records.insert(id, message);
        self.posts += 1;
    }

    pub fn list(&self) -> String {
        match serde_json::to_string(&self.records) {
            Ok(records) => records,
            Err(_e) => "{}".to_string(),
        }
    }

    #[payable]
    pub fn donate(&mut self, post_id: String) {
        let deposit: u128 = env::attached_deposit();

        let post = match self.records.get(&post_id) {
            Some(review) => review,
            None => panic!("this is a terrible mistake!"),
        };

        Promise::new(post.created_by.clone()).transfer(deposit);

        let review = {Message {
            image_link: post.image_link.clone(),
            company_name: post.company_name.clone(),
            company_address: post.company_address.clone(),
            your_quote: post.your_quote.clone(),
            donation: post.donation + deposit.clone(),
            created_by: post.created_by.clone(),
        }};

        self.records.insert(post_id, review);
        self.donations += deposit;
    }

    pub fn get_total_posts(&self) -> u128 {
        self.posts
    }

    pub fn get_total_donations(&self) -> u128 {
        self.donations
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use near_sdk::MockedBlockchain;
    use near_sdk::{testing_env, VMContext};

    fn get_context(input: Vec<u8>, is_view: bool) -> VMContext {
        VMContext {
            current_account_id: "alice_near".to_string(),
            signer_account_id: "bob_near".to_string(),
            signer_account_pk: vec![0, 1, 2],
            predecessor_account_id: "carol_near".to_string(),
            input,
            block_index: 0,
            block_timestamp: 0,
            account_balance: 0,
            account_locked_balance: 0,
            storage_usage: 0,
            attached_deposit: 0,
            prepaid_gas: 10u64.pow(18),
            random_seed: vec![0, 1, 2],
            is_view,
            output_data_receivers: vec![],
            epoch_height: 19,
        }
    }
}
