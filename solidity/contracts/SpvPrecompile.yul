object "Echo" {
  code {
    let size := calldatasize()
    // jump to start of free memory
    let output := 0x80

    // Copy the data to a new buffer in memory
    calldatacopy(output,0,size)

    // Return the output buffer and its size
    return(output, size)
  }
}
