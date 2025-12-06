import { useEffect, useState } from "react";
import { createYDocConnection } from "../utils/yjsClient";

export function useSharedMap(roomName, mapName = "schedule") {
  const [data, setData] = useState({});
  const [ymap, setYMap] = useState(null);

  useEffect(() => {
    const ydoc = createYDocConnection(roomName);
    const sharedMap = ydoc.getMap(mapName);
    setYMap(sharedMap);

    const updateHandler = () => {
      setData(sharedMap.toJSON());
    };

    sharedMap.observe(updateHandler);
    return () => sharedMap.unobserve(updateHandler);
  }, [roomName, mapName]);

  const updateField = (key, value) => {
    if (!ymap) return;
    ymap.set(key, value);
  };

  const deleteField = (key) => {
    if (!ymap) return;
    ymap.delete(key);
  };

  return { data, updateField, deleteField };
}
