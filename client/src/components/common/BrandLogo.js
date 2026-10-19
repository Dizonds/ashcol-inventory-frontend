import React, { useEffect, useState } from "react";
import { api } from "../../api";

export default function BrandLogo({ brand }) {
  const id = brand.id || brand._id;
  const [logo, setLogo] = useState(null);

  useEffect(() => {
    let active = true;
    setLogo(null);
    if (id) {
      api("get", `/brands/${id}/logo`)
        .then(({ data }) => {
          if (active && data?.logoUrl) setLogo(data);
        })
        .catch(() => {});
    }
    return () => { active = false; };
  }, [id, brand.name]);

  if (!logo) return <span className="suppliers-brand-fallback">{brand.name}</span>;

  return (
    <a className="suppliers-brand-logo" href={logo.sourceUrl} target="_blank" rel="noopener noreferrer" title={brand.name}>
      <img src={logo.logoUrl} alt={brand.name} loading="eager" referrerPolicy="no-referrer" onError={() => setLogo(null)} />
    </a>
  );
}
