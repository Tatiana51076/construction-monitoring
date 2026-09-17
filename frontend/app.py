"""Streamlit-дашборд для быстрой демонстрации работы системы.

Запуск: streamlit run app.py
"""
import os
import requests
import streamlit as st

API_URL = os.getenv("API_URL", "http://localhost:8000")

st.set_page_config(page_title="Мониторинг стройплощадки", page_icon="🏗️", layout="wide")

st.title("🏗️ Мониторинг строительной площадки")
st.caption("Обнаружение техники на снимках и сопоставление с календарным графиком работ")

with st.sidebar:
    st.header("Параметры снимка")
    camera_id = st.text_input("ID камеры", value="1")
    zone = st.selectbox("Зона", ["A", "B", "C"], index=0)
    timestamp = st.text_input("Время снимка (ISO)", value="2026-07-10T10:00:00")
    on_date = st.text_input("Дата анализа", value="2026-07-10")

uploaded = st.file_uploader("Загрузите снимки", type=["jpg", "jpeg", "png"],
                            accept_multiple_files=True)

if st.button("Проанализировать", type="primary") and uploaded:
    files = [("files", (f.name, f.getvalue(), f.type)) for f in uploaded]
    data = {
        "camera_id": camera_id,
        "zone": zone,
        "timestamp": timestamp,
        "date": on_date,
    }
    try:
        r = requests.post(f"{API_URL}/api/analyze", files=files, data=data, timeout=120)
        r.raise_for_status()
        res = r.json()

        col1, col2 = st.columns(2)
        with col1:
            st.metric("Текущий этап", res.get("stage_name") or "—")
        with col2:
            st.metric("Зона", res.get("zone") or "—")

        st.subheader("Обнаруженная техника (уникальная)")
        st.json(res.get("detected", {}))

        st.subheader("Требуется по плану")
        st.json(res.get("required", {}))

        st.subheader("Отклонения")
        devs = res.get("deviations", [])
        if not devs:
            st.success("Отклонений не выявлено")
        else:
            colors = {"high": "🔴", "medium": "🟠", "low": "🟡"}
            for d in devs:
                st.warning(f"{colors.get(d['severity'], '⚪')} **{d['type']}** — {d['message']}")

        st.metric("Риск срыва сроков", f"{res.get('risk_score', 0)}/100")
    except Exception as e:
        st.error(f"Ошибка анализа: {e}")

st.divider()
st.caption("MVP • демонстрация сквозного сценария: снимок → техника → этап → отклонение")
