<?php
namespace classes;

use Block;

class Blockchain
{
    public array $chain = [];

    public bool $hasChains = false;
    public function __construct($postID = false, $data = [])
    {
        $this->setChains($postID);
        $this->chain[] = $this->createSDBlock($postID, $data);
    }

    private function setChains($postID = false){
        global $wpdb;
        if($postID){
            
            $result = $wpdb->get_results("SELECT * FROM {$wpdb->prefix}blockchain WHERE post_id = {$postID}", OBJECT );
            if($result){
                $block = new Block();
                $this->hasChains = true;
                
                foreach ($result as $key => $value) {
                    $block->setBlock($value->post_id, $value->n_version, $value->time, json_decode(stripslashes($value->data),true), $value->prev_block_hash, $value->block_hash);
                    $this->chain[] = $block;
                }
                return $postID;
            }
            
        }
        
    }

    private function createSDBlock($postID = false, $data = []): Block
    {
        global $wpdb;
        
        if(count($this->chain) > 0){
            $block = $this->addBlock($postID, count($this->chain) + 1, time(), $data);
        }else{
            $block = new Block();
            $block->newBlock($postID, 0, time(), $data, '0');
        }

        $wpdb->insert($wpdb->prefix.'blockchain', array(
            'post_id' => $block->postID,
            'n_version' => $block->index,
            'time' => date('Y-m-d H:i:s', $block->timestamp),
            'block_hash' => $block->hash,
            'author' => get_current_user_id(),
            'prev_block_hash' => $block->previousHash,
            'data' => wp_json_encode($block->data),
            'merkle_root' => null
        ));
        return $block;
    }

    public function getLatestBlock(): Block
    {
        return $this->chain[count($this->chain) - 1];
    }

    public function addBlock(int $postID, int $index, string $timestamp, $data)
    {
        $newBlock = new Block();
        $prevHash = $this->getLatestBlock()->hash;
        $newBlock->newBlock($postID, $index, $timestamp, $data, $prevHash);
        $newBlock->previousHash = $prevHash;
        $newBlock->hash = $newBlock->calculateHash();
        $this->chain[] = $newBlock;

        return $newBlock;
    }

    public function isChainValid(): bool
    {
        for ($i = 1, $chainLength = count($this->chain); $i < $chainLength; $i++) {
            $currentBlock = $this->chain[$i];
            $previousBlock = $this->chain[$i - 1];

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