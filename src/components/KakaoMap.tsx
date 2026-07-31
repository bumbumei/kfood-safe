"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useRef, useState } from "react";
import type { Restaurant } from "@/lib/types";

const KEY = process.env.NEXT_PUBLIC_KAKAO_MAP_KEY;
const BUSAN_CENTER = { lat: 35.1796, lng: 129.0756 };

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export default function KakaoMap({ restaurants }: { restaurants: Restaurant[] }) {
  const divRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const clustererRef = useRef<any>(null);
  const infoRef = useRef<any>(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

  // Load the Kakao Maps SDK once
  useEffect(() => {
    if (!KEY) return;
    const w = window as any;
    if (w.kakao?.maps?.Map) {
      setReady(true);
      return;
    }
    const onLoad = () => w.kakao.maps.load(() => setReady(true));
    const existing = document.getElementById("kakao-sdk") as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener("load", onLoad);
      return;
    }
    const s = document.createElement("script");
    s.id = "kakao-sdk";
    s.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${KEY}&autoload=false&libraries=clusterer`;
    s.onload = onLoad;
    s.onerror = () => setFailed(true);
    document.head.appendChild(s);
  }, []);

  // (Re)draw markers whenever data changes
  useEffect(() => {
    if (!ready || !divRef.current) return;
    const kakao = (window as any).kakao;

    if (!mapRef.current) {
      mapRef.current = new kakao.maps.Map(divRef.current, {
        center: new kakao.maps.LatLng(BUSAN_CENTER.lat, BUSAN_CENTER.lng),
        level: 8,
      });
      clustererRef.current = new kakao.maps.MarkerClusterer({
        map: mapRef.current,
        averageCenter: true,
        minLevel: 6,
      });
      infoRef.current = new kakao.maps.InfoWindow({ removable: true });
    }

    const clusterer = clustererRef.current;
    clusterer.clear();

    const points = restaurants.filter((r) => r.lat != null && r.lng != null);
    const markers = points.map((r) => {
      const marker = new kakao.maps.Marker({
        position: new kakao.maps.LatLng(r.lat, r.lng),
        title: r.name,
      });
      kakao.maps.event.addListener(marker, "click", () => {
        infoRef.current.setContent(
          `<div style="padding:8px 12px;max-width:230px;font-size:12px;line-height:1.5">
             <strong>${escapeHtml(r.name)}</strong><br/>
             <span style="color:#78716c">${escapeHtml(r.address)}</span>
             ${r.menu ? `<br/><span style="color:#059669">🍴 ${escapeHtml(r.menu)}</span>` : ""}
             ${r.tel ? `<br/><span style="color:#a8a29e">☎ ${escapeHtml(r.tel)}</span>` : ""}
           </div>`,
        );
        infoRef.current.open(mapRef.current, marker);
      });
      return marker;
    });
    clusterer.addMarkers(markers);

    if (points.length > 0) {
      const bounds = new kakao.maps.LatLngBounds();
      points.forEach((r) => bounds.extend(new kakao.maps.LatLng(r.lat, r.lng)));
      mapRef.current.setBounds(bounds);
    }
  }, [ready, restaurants]);

  if (!KEY || failed) {
    return (
      <div className="flex h-[420px] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-stone-300 bg-stone-50 p-8 text-center">
        <p className="text-3xl">🗺️</p>
        {failed ? (
          <>
            <p className="mt-3 font-semibold">Kakao Maps SDK failed to load</p>
            <p className="mt-2 max-w-md text-sm text-stone-500">
              The key is set, but Kakao rejected the request — usually this means the
              current domain (<code className="rounded bg-stone-200 px-1">{typeof window !== "undefined" ? window.location.origin : ""}</code>)
              is not registered. In{" "}
              <a
                href="https://developers.kakao.com"
                target="_blank"
                rel="noreferrer"
                className="text-emerald-600 underline"
              >
                developers.kakao.com
              </a>{" "}
              open your app → 앱 설정 → 플랫폼 → Web and add this exact origin to 사이트
              도메인. Also check 카카오맵 활성화 (제품 설정 → 카카오맵 → ON).
            </p>
          </>
        ) : (
          <>
            <p className="mt-3 font-semibold">Kakao Map key not configured</p>
            <p className="mt-2 max-w-md text-sm text-stone-500">
              Get a free JavaScript key at{" "}
              <a
                href="https://developers.kakao.com"
                target="_blank"
                rel="noreferrer"
                className="text-emerald-600 underline"
              >
                developers.kakao.com
              </a>{" "}
              (My Application → App Key → JavaScript key, and register{" "}
              <code className="rounded bg-stone-200 px-1">http://localhost:3000</code> as
              a Web platform domain), then add it to{" "}
              <code className="rounded bg-stone-200 px-1">.env.local</code> as{" "}
              <code className="rounded bg-stone-200 px-1">NEXT_PUBLIC_KAKAO_MAP_KEY</code>.
            </p>
          </>
        )}
      </div>
    );
  }

  return (
    <div
      ref={divRef}
      className="h-[520px] w-full overflow-hidden rounded-2xl border border-stone-200"
    />
  );
}
