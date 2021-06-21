import React, { useState, useEffect, useCallback } from "react";
import { Plugins, FilesystemDirectory } from "@capacitor/core";

import MemoriesContext, { Memory } from "./memories-context";

const { Storage, Filesystem } = Plugins;

const MemoriesContextProvider: React.FC = (props) => {
  const [memories, setMemories] = useState<Memory[]>([]);

  useEffect(() => {
    const storableMemories = memories.map(memory => (
      {
        id: memory.id, 
        title: memory.title, 
        type: memory.type, 
        imagePath: memory.imagePath
      }
    ));

    Storage.set({key: "memories", value: JSON.stringify(storableMemories)});
  }, [memories]);

  const addMemory = (path: string, base64Data: string, title: string, type: "good" | "bad") => {
    const newMemory: Memory = {
      id: Math.random().toString(), 
      title, 
      type, 
      imagePath: path, 
      base64Url: base64Data
    };
    setMemories(prevMemories => [ ...prevMemories, newMemory]);
  };

  const initContext = useCallback( async () => { //this function should never be recreated because everything done in this functino is static. 
    // Therefore this initContext function will not be recreated, even though MemoriesContextProvider component is re-evaluated.
    const memoriesData = await Storage.get({key: "memories"});
    const storedMemories = memoriesData.value ? JSON.parse(memoriesData.value) : [];

    const loadedMemories: Memory[] = [];
    for (const storedMemory of storedMemories) {
      const file = await Filesystem.readFile({
        path: storedMemory.imagePath, 
        directory: FilesystemDirectory.Data
      });
      loadedMemories.push({
        id: storedMemory.id, 
        title: storedMemory.title, 
        type: storedMemory.type, 
        imagePath: storedMemory.imagePath, 
        base64Url: 'data:image/jpeg;base64,' + file.data
      })
    }

    setMemories(loadedMemories);
  }, []); // an array of dependency, that whenever such dependency changes, this function "initContext" will be recreated. 

  return (
    <MemoriesContext.Provider value={{memories, addMemory, initContext}}>
      {props.children}
    </MemoriesContext.Provider>
  );
};

export default MemoriesContextProvider;