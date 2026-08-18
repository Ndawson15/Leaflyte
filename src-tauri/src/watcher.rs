use crate::vault::VaultState;
use notify::{Event, EventKind, RecommendedWatcher, RecursiveMode, Watcher};
use std::sync::{Arc, Mutex};
use std::time::{Duration, Instant};
use tauri::{AppHandle, Emitter, Manager};

pub fn start(app: AppHandle) {
    std::thread::spawn(move || {
        let last_emit = Arc::new(Mutex::new(Instant::now() - Duration::from_secs(10)));
        let app_for_cb = app.clone();

        let mut watcher = match RecommendedWatcher::new(
            move |res: Result<Event, notify::Error>| {
                if res.is_err() {
                    return;
                }
                let Ok(event) = res else {
                    return;
                };
                let relevant = matches!(
                    event.kind,
                    EventKind::Create(_)
                        | EventKind::Modify(_)
                        | EventKind::Remove(_)
                        | EventKind::Any
                );
                if !relevant {
                    return;
                }
                let mut last = last_emit.lock().unwrap();
                if last.elapsed() < Duration::from_millis(400) {
                    return;
                }
                *last = Instant::now();
                let _ = app_for_cb.emit("vault-changed", ());
            },
            notify::Config::default(),
        ) {
            Ok(w) => w,
            Err(_) => return,
        };

        let mut watched: Option<std::path::PathBuf> = None;
        loop {
            if let Some(state) = app.try_state::<VaultState>() {
                if let Ok(root) = state.root.lock() {
                    if watched.as_ref() != Some(&*root) {
                        if let Some(prev) = watched.take() {
                            let _ = watcher.unwatch(&prev);
                        }
                        if watcher.watch(&*root, RecursiveMode::Recursive).is_ok() {
                            watched = Some(root.clone());
                        }
                    }
                }
            }
            std::thread::sleep(Duration::from_secs(2));
        }
    });
}
