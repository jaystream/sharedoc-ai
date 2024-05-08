<?php
class Block
{
    public int $postID;
    public int $index;
    public string $timestamp;
    public $data;
    public string $previousHash;
    public string $hash;

    public function __construct()
    {

    }

    public function newBlock(int $postID, int $index, string $timestamp, $data, string $previousHash = '', string $currHash = '')
    {
        
        $this->postID = $postID;
        $this->index = $index;
        $this->timestamp = $timestamp;
        $this->data = $data;
        $this->previousHash = $previousHash;
        $this->hash = (!empty($currHash) ? $currHash : $this->calculateHash());
    }

    public function clearBlock()
    {
        $this->postID = 0;
        $this->index = 0;
        $this->timestamp = 0;
        $this->data = [];
        $this->previousHash = null;
        $this->hash = null;
    }

    public function setBlock(int $postID, int $index, string $timestamp, $data, string $previousHash = '', string $currHash = '')
    {
        $this->postID = $postID;
        $this->index = $index;
        $this->timestamp = $timestamp;
        $this->data = $data;
        $this->previousHash = $previousHash;
        $this->hash = $currHash;
    }


    public function calculateHash(): string
    {
        return hash(
            'sha256', 
            sprintf(
               '%d%d%s%s%s',
               $this->postID,
               $this->index,
               $this->timestamp,
               $this->previousHash,
               json_encode($this->data),
           )
        );
    }
}