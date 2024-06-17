<?php
namespace classes;

use Block;

class Blockchain
{
    public array $chains = [];
    public string $branch;

    public bool $hasChains = false;
    public function __construct($postID = false, $data = [], $branch = 'origin' )
    {   
        $this->branch = $branch;
        if($postID){
            $this->setChains($postID);
            $this->chains[] = $this->createSDBlock($postID, $data);
        }
    }

    public function setChains($postID = false, $branch = 'origin'){
        global $wpdb;

        $this->branch = $branch;
        if($postID){
            
            $result = $wpdb->get_results("SELECT * FROM {$wpdb->prefix}blockchain WHERE post_id = {$postID}", OBJECT );
            if($result){
                $this->hasChains = true;
                
                foreach ($result as $key => $value) {
                    $block = new Block();
                    $block->setBlock($value->post_id, $value->n_version, $value->time, json_decode($value->data,true), $value->prev_block_hash, $value->block_hash);
                    $block->type = $value->type;
                    $this->chains[] = $block;
                    
                }
                
                return $postID;
            }
            
        }
        
    }

    public function createSDBlock($postID = false, $data = [],$branch = 'origin'): Block
    {
        global $wpdb;
        $this->branch = $branch;
        $type = 'origin';
        if(count($this->chains) > 0){
            $block = $this->addBlock($postID, count($this->chains) + 1, time(), $data);
            $type = 'suggestion';
        }else{
            $block = new Block();
            $block->newBlock($postID, 1, time(), $data, '0');
        }
        
        
        $wpdb->query('START TRANSACTION');

        $wpdb->insert($wpdb->prefix.'blockchain', array(
            'post_id' => $block->postID,
            'n_version' => $block->index,
            'type' => $type,
            'branch' => $branch,
            'time' => date('Y-m-d H:i:s', $block->timestamp),
            'block_hash' => $block->hash,
            'author' => get_current_user_id(),
            'prev_block_hash' => $block->previousHash,
            'data' => wp_json_encode($block->data),
            'merkle_root' => null
        ));
        
        $bcID = $wpdb->insert_id;
        if(isset($data['changes']) && count($data['changes']) > 0){
            foreach ($data['changes'] as $theChanged) {
                $wpdb->insert($wpdb->prefix.'blockchain_edits', array(
                    'bc_id' => $bcID,
                    'author' => get_current_user_id(),
                    'action' => $theChanged[0],
                    'length' => strlen($theChanged[1]),
                    'time' => date('Y-m-d H:i:s', $block->timestamp),
                    'changes' => $theChanged[1],
                ));
            }
        }

        $wpdb->query( "COMMIT" );
        return $block;
    }

    public function getLatestBlock(): Block
    {
        return $this->chains[count($this->chains) - 1];
    }

    public function addBlock(int $postID, int $index, string $timestamp, $data)
    {
        $newBlock = new Block();
        $prevHash = $this->getLatestBlock()->hash;
        $newBlock->newBlock($postID, $index, $timestamp, $data, $prevHash);
        $newBlock->previousHash = $prevHash;
        $newBlock->hash = $newBlock->calculateHash();
        $this->chains[] = $newBlock;

        return $newBlock;
    }

    public function isChainValid(): bool
    {
        for ($i = 1, $chainLength = count($this->chains); $i < $chainLength; $i++) {
            $currentBlock = $this->chains[$i];
            $previousBlock = $this->chains[$i - 1];

            if ($currentBlock->hash !== $currentBlock->calculateHash()) {
                return false;
            }

            if ($currentBlock->previousHash !== $previousBlock->hash) {
                return false;
            }
        }

        return true;
    }
}