export const API_BASE_URL = import.meta.env.VITE_API_URL === '/api' ? '/api' : (import.meta.env.VITE_API_URL || '/api');

const parseResponse = async (res: Response) => {
    if (res.status === 401 || res.status === 403) {
        const err: any = new Error('AUTH');
        err.status = res.status;
        throw err;
    }
    if (res.status === 413) {
        const err: any = new Error('UPLOAD_TOO_LARGE');
        err.status = 413;
        throw err;
    }
    if (!res.ok) {
        // Try read json, else text
        try {
            const j = await res.json();
            let msg = j.error || j.message || 'Request failed';
            if (j.duplicate && Array.isArray(j.duplicate) && j.duplicate.length > 0) {
                msg += ` (Duplikasi: ${j.duplicate.join(', ')})`;
            }
            const err: any = new Error(msg);
            (err as any).status = res.status;
            err.payload = j;
            throw err;
        } catch {
            const t = await res.text().catch(() => '');
            console.error('API Error Response Text:', t, 'Status:', res.status);
            const msg = t || (res.status === 404 ? 'Resource not found (404)' : `Request failed (Status: ${res.status} ${res.statusText})`);
            const err: any = new Error(msg);
            (err as any).status = res.status;
            throw err;
        }
    }
    return res.json();
};

export const api = {
    // Generic methods
    get: async (endpoint: string, config?: any) => {
        const token = config?.headers?.Authorization?.replace('Bearer ', '');
        const params = new URLSearchParams(config?.params || {}).toString();
        const url = params ? `${API_BASE_URL}${endpoint}?${params}` : `${API_BASE_URL}${endpoint}`;
        
        const res = await fetch(url, {
            headers: {
                ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
                ...(config?.headers || {})
            },
            credentials: 'include'
        });
        return parseResponse(res);
    },
    post: async (endpoint: string, data: any, config?: any) => {
        const token = config?.headers?.Authorization?.replace('Bearer ', '');
        const isFormData = data instanceof FormData;
        
        const headers: any = {
            ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
            ...(config?.headers || {})
        };
        
        if (!isFormData && !headers['Content-Type']) {
            headers['Content-Type'] = 'application/json';
        }
        
        if (isFormData && headers['Content-Type'] === 'multipart/form-data') {
            delete headers['Content-Type'];
        }
        
        const res = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'POST',
            headers,
            body: isFormData ? data : JSON.stringify(data),
            credentials: 'include'
        });
        return parseResponse(res);
    },
    put: async (endpoint: string, data: any, config?: any) => {
        const token = config?.headers?.Authorization?.replace('Bearer ', '');
        const isFormData = data instanceof FormData;
        
        const headers: any = {
            ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
            ...(config?.headers || {})
        };
        
        if (!isFormData && !headers['Content-Type']) {
            headers['Content-Type'] = 'application/json';
        }

        if (isFormData && headers['Content-Type'] === 'multipart/form-data') {
            delete headers['Content-Type'];
        }

        const res = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'PUT',
            headers,
            body: isFormData ? data : JSON.stringify(data),
            credentials: 'include'
        });
        return parseResponse(res);
    },
    delete: async (endpoint: string, config?: any) => {
        const token = config?.headers?.Authorization?.replace('Bearer ', '');
        const params = new URLSearchParams(config?.params || {}).toString();
        const url = params ? `${API_BASE_URL}${endpoint}?${params}` : `${API_BASE_URL}${endpoint}`;

        const res = await fetch(url, {
            method: 'DELETE',
            headers: {
                ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
                ...(config?.headers || {})
            },
            credentials: 'include'
        });
        return parseResponse(res);
    },

    // Auth
    login: async (username, password) => {
        const res = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password }),
            credentials: 'include'
        });
        let json: any = null;
        try {
            json = await res.json();
        } catch {
            if (!res.ok) {
                throw new Error('Login failed: server returned an invalid response');
            }
            throw new Error('Login failed: empty response from server');
        }
        if (!res.ok) {
            throw new Error(json?.error || 'Login failed');
        }
        return json;
    },
    
    logout: async () => {
        const res = await fetch(`${API_BASE_URL}/auth/logout`, {
            method: 'POST',
            credentials: 'include'
        });
        if (!res.ok) throw new Error('Logout failed');
        return res.json();
    },

    register: async (payload) => {
        const res = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            credentials: 'include'
        });
        return parseResponse(res);
    },
    checkRegisterDuplicates: async (payload) => {
        const res = await fetch(`${API_BASE_URL}/auth/check-duplicate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            credentials: 'include'
        });
        return parseResponse(res);
    },
    checkRegisterDuplicatesGet: async (payload) => {
        const params = new URLSearchParams();
        Object.entries(payload || {}).forEach(([k, v]) => {
            if (v !== undefined && v !== null && String(v).length > 0) {
                params.append(k, String(v));
            }
        });
        const res = await fetch(`${API_BASE_URL}/auth/check-duplicate?${params.toString()}`, {
            method: 'GET',
            credentials: 'include'
        });
        return parseResponse(res);
    },

    publishing: {
        getCreators: async (token) => {
            const res = await fetch(`${API_BASE_URL}/publishing/creators`, { 
                headers: token ? { 'Authorization': `Bearer ${token}` } : {},
                credentials: 'include' 
            });
            return parseResponse(res);
        },
        getCreatorById: async (token, id: string) => {
            console.log('API Request:', `${API_BASE_URL}/publishing/creators/${id}`);
            const res = await fetch(`${API_BASE_URL}/publishing/creators/${id}`, { 
                headers: token ? { 'Authorization': `Bearer ${token}` } : {},
                credentials: 'include' 
            });
            return parseResponse(res);
        },
        createCreator: async (token, formData: FormData) => {
            const res = await fetch(`${API_BASE_URL}/publishing/creators`, {
                method: 'POST',
                headers: token ? { 'Authorization': `Bearer ${token}` } : {},
                body: formData,
                credentials: 'include'
            });
            return parseResponse(res);
        },
        updateCreator: async (token, id: string, formData: FormData) => {
            const res = await fetch(`${API_BASE_URL}/publishing/creators/${id}`, {
                method: 'PUT',
                headers: token ? { 'Authorization': `Bearer ${token}` } : {},
                body: formData,
                credentials: 'include'
            });
            return parseResponse(res);
        },
        deleteCreator: async (token, id: string) => {
            const res = await fetch(`${API_BASE_URL}/publishing/creators/${id}`, {
                method: 'DELETE',
                headers: token ? { 'Authorization': `Bearer ${token}` } : {},
                credentials: 'include'
            });
            return parseResponse(res);
        },
        getSongs: async (token) => {
            const res = await fetch(`${API_BASE_URL}/publishing/songs`, { 
                headers: token ? { 'Authorization': `Bearer ${token}` } : {},
                credentials: 'include' 
            });
            return parseResponse(res);
        },
        createSong: async (token, formData: FormData) => {
            const res = await fetch(`${API_BASE_URL}/publishing/songs`, {
                method: 'POST',
                headers: token ? { 'Authorization': `Bearer ${token}` } : {},
                body: formData,
                credentials: 'include'
            });
            return parseResponse(res);
        },
        updateSong: async (token, id: number, formData: FormData) => {
            const res = await fetch(`${API_BASE_URL}/publishing/songs/${id}`, {
                method: 'PUT',
                headers: token ? { 'Authorization': `Bearer ${token}` } : {},
                body: formData,
                credentials: 'include'
            });
            return parseResponse(res);
        },
        deleteSong: async (token, id: number) => {
            const res = await fetch(`${API_BASE_URL}/publishing/songs/${id}`, {
                method: 'DELETE',
                headers: token ? { 'Authorization': `Bearer ${token}` } : {},
                credentials: 'include'
            });
            return parseResponse(res);
        },
        updateSongStatus: async (token, id: string, status: string, songId?: string, reason?: string) => {
            const res = await fetch(`${API_BASE_URL}/publishing/songs/${id}/status`, {
                method: 'PUT',
                headers: { 
                    'Content-Type': 'application/json',
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                },
                body: JSON.stringify({ status, song_id: songId, rejection_reason: reason }),
                credentials: 'include'
            });
            return parseResponse(res);
        },
        uploadReport: async (token, formData: FormData) => {
            const res = await fetch(`${API_BASE_URL}/publishing/reports/upload`, {
                method: 'POST',
                headers: token ? { 'Authorization': `Bearer ${token}` } : {},
                body: formData,
                credentials: 'include'
            });
            return parseResponse(res);
        },
        getReports: async (token, month?: number, year?: number) => {
            const params = new URLSearchParams();
            if (month) params.append('month', String(month));
            if (year) params.append('year', String(year));
            const res = await fetch(`${API_BASE_URL}/publishing/reports?${params.toString()}`, { 
                headers: token ? { 'Authorization': `Bearer ${token}` } : {},
                credentials: 'include' 
            });
            return parseResponse(res);
        },
        getAnalytics: async (token) => {
            const res = await fetch(`${API_BASE_URL}/publishing/analytics/stats`, { 
                headers: token ? { 'Authorization': `Bearer ${token}` } : {},
                credentials: 'include' 
            });
            return parseResponse(res);
        }
    },

    // Releases
    getReleases: async (token) => {
        const res = await fetch(`${API_BASE_URL}/releases`, {
            headers: token ? { 'Authorization': `Bearer ${token}` } : {},
            credentials: 'include'
        });
        return parseResponse(res);
    },

    updateReleaseWorkflow: async (token, data) => {
        const res = await fetch(`${API_BASE_URL}/releases/${data.id}/workflow`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            },
            credentials: 'include',
            body: JSON.stringify({
                status: data.status,
                aggregator: data.aggregator,
                upc: data.upc,
                rejectionReason: (data as any).rejectionReason,
                rejectionDescription: (data as any).rejectionDescription,
                tracks: (data.tracks || []).map((t: any) => ({
                    id: t.id,
                    isrc: t.isrc
                }))
            })
        });
        return parseResponse(res);
    },

    getRelease: async (token, id) => {
        const res = await fetch(`${API_BASE_URL}/releases/${id}`, {
            headers: token ? { 'Authorization': `Bearer ${token}` } : {},
            credentials: 'include'
        });
        return parseResponse(res);
    },

    deleteRelease: async (token, id) => {
        const res = await fetch(`${API_BASE_URL}/releases/${id}`, {
            method: 'DELETE',
            headers: token ? { 'Authorization': `Bearer ${token}` } : {},
            credentials: 'include'
        });
        return parseResponse(res);
    },

    updateReleaseCoverArt: async (token, id, file) => {
        const formData = new FormData();
        formData.append('cover_art', file);
        const res = await fetch(`${API_BASE_URL}/releases/${id}/cover-art`, {
            method: 'POST',
            headers: { ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
            body: formData,
            credentials: 'include'
        });
        return parseResponse(res);
    },

    createRelease: async (token, data) => {
        const formData = new FormData();

        // Append JSON data
        formData.append('data', JSON.stringify(data));

        const res = await fetch(`${API_BASE_URL}/releases`, {
            method: 'POST',
            headers: { 
                ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                // Content-Type must be undefined for FormData
            },
            body: formData,
            credentials: 'include'
        });
        
        return parseResponse(res);
    },

    uploadReleaseFile: async (token, releaseMeta, fieldName, file) => {
        const formData = new FormData();
        formData.append('data', JSON.stringify({
            title: releaseMeta.title,
            primaryArtists: releaseMeta.primaryArtists || [],
            field: fieldName
        }));
        // Send under both a generic 'file' key and the specific fieldName for broader backend compatibility
        formData.append('file', file);
        formData.append(fieldName, file);

        const res = await fetch(`${API_BASE_URL}/releases/upload`, {
            method: 'POST',
            headers: { ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
            body: formData,
            credentials: 'include'
        });

        return parseResponse(res);
    },
    uploadTmpReleaseFile: async (token, releaseMeta, fieldName, file) => {
        const formData = new FormData();
        formData.append('data', JSON.stringify({
            title: releaseMeta.title,
            primaryArtists: releaseMeta.primaryArtists || [],
            field: fieldName
        }));
        formData.append('file', file);
        formData.append(fieldName, file);
        const res = await fetch(`${API_BASE_URL}/releases/upload-tmp`, {
            method: 'POST',
            headers: { ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
            body: formData,
            credentials: 'include'
        });
        return parseResponse(res);
    },
    uploadTmpReleaseFileChunked: async (token, releaseMeta, fieldName, file: File, chunkSize = 10 * 1024 * 1024, onProgress?: (p: number) => void) => {
        const total = Math.ceil(file.size / chunkSize);
        const fileId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
        for (let i = 0; i < total; i++) {
            const start = i * chunkSize;
            const end = Math.min(file.size, start + chunkSize);
            const blob = file.slice(start, end);
            const formData = new FormData();
            formData.append('data', JSON.stringify({
                title: releaseMeta.title,
                primaryArtists: releaseMeta.primaryArtists || [],
                field: fieldName,
                fileId,
                chunkIndex: i,
                totalChunks: total,
                filename: file.name
            }));
            formData.append('chunk', blob);
            const res = await fetch(`${API_BASE_URL}/releases/upload-tmp-chunk`, {
                method: 'POST',
                headers: { ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
                body: formData,
                credentials: 'include'
            });
            const json = await parseResponse(res);
            if (typeof onProgress === 'function') {
                const percent = Math.round(((i + 1) / total) * 100);
                onProgress(percent);
            }
            if (json && json.done) {
                return json;
            }
        }
        throw new Error('Chunked upload incomplete');
    },

    uploadReleaseFileProgress: (token: string, releaseMeta: any, fieldName: string, file: File, onProgress?: (p: number) => void) => {
        return new Promise(async (resolve, reject) => {
            try {
                const formData = new FormData();
                formData.append('data', JSON.stringify({
                    title: releaseMeta.title,
                    primaryArtists: releaseMeta.primaryArtists || [],
                    field: fieldName
                }));
                formData.append('file', file);
                formData.append(fieldName, file);

                const xhr = new XMLHttpRequest();
                xhr.open('POST', `${API_BASE_URL}/releases/upload`, true);
                if (token) {
                    xhr.setRequestHeader('Authorization', `Bearer ${token}`);
                }
                xhr.withCredentials = true;
                xhr.upload.onprogress = (evt) => {
                    if (evt.lengthComputable && typeof onProgress === 'function') {
                        const percent = Math.round((evt.loaded / evt.total) * 100);
                        onProgress(percent);
                    }
                };
                xhr.onreadystatechange = () => {
                    if (xhr.readyState === 4) {
                        if (xhr.status === 401 || xhr.status === 403) {
                            const err: any = new Error('AUTH');
                            (err as any).status = xhr.status;
                            reject(err);
                            return;
                        }
                        if (xhr.status === 413) {
                            const err: any = new Error('UPLOAD_TOO_LARGE');
                            (err as any).status = 413;
                            reject(err);
                            return;
                        }
                        if (xhr.status >= 200 && xhr.status < 300) {
                            try {
                                const json = JSON.parse(xhr.responseText || '{}');
                                resolve(json);
                            } catch {
                                reject(new Error('Invalid JSON response'));
                            }
                        } else {
                            try {
                                const j = JSON.parse(xhr.responseText || '{}');
                                const msg = j.error || 'Request failed';
                                const err: any = new Error(msg);
                                (err as any).status = xhr.status;
                                err.payload = j;
                                reject(err);
                            } catch {
                                reject(new Error(xhr.responseText || 'Request failed'));
                            }
                        }
                    }
                };
                xhr.onerror = () => reject(new Error('Network error'));
                xhr.send(formData);
            } catch (e) {
                reject(e);
            }
        });
    },
    cleanupTmp: async (token: string, meta: { title: string; primaryArtists: any[] }) => {
        const res = await fetch(`${API_BASE_URL}/releases/tmp/cleanup`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            },
            body: JSON.stringify(meta),
            credentials: 'include'
        });
        return parseResponse(res);
    },
    generateClipPreview: async (token: string, tmpPath: string, startSec: number, durationSec = 60) => {
        const res = await fetch(`${API_BASE_URL}/releases/tmp/preview-clip`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            },
            credentials: 'include',
            body: JSON.stringify({ tmpPath, startSec, durationSec })
        });
        return parseResponse(res);
    },

    // Reports
    getReports: async (token) => {
        const res = await fetch(`${API_BASE_URL}/reports`, {
            headers: token ? { 'Authorization': `Bearer ${token}` } : {},
            credentials: 'include'
        });
        return parseResponse(res);
    },

    importReports: async (token, data) => {
        const res = await fetch(`${API_BASE_URL}/reports/import`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ data })
        });
        if (!res.ok) throw new Error('Failed to import reports');
        return res.json();
    },

    // Notifications
    getNotifications: async (token) => {
        const res = await fetch(`${API_BASE_URL}/notifications`, {
            headers: token ? { 'Authorization': `Bearer ${token}` } : {},
            credentials: 'include'
        });
        return parseResponse(res);
    },

    markNotificationRead: async (token, id) => {
        const res = await fetch(`${API_BASE_URL}/notifications/mark-read`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            },
            body: JSON.stringify({ id }),
            credentials: 'include'
        });
        return parseResponse(res);
    },

    // Contracts
    getAggregatorContracts: async (token: string) => {
        const res = await fetch(`${API_BASE_URL}/users/contracts/aggregator`, {
            headers: token ? { 'Authorization': `Bearer ${token}` } : {},
            credentials: 'include'
        });
        return parseResponse(res);
    },
    deleteAggregatorContract: async (token: string, id: number) => {
        const res = await fetch(`${API_BASE_URL}/users/${id}/contract`, {
            method: 'DELETE',
            headers: token ? { 'Authorization': `Bearer ${token}` } : {},
            credentials: 'include'
        });
        return parseResponse(res);
    },
    getPublishingContracts: async (token: string) => {
        const res = await fetch(`${API_BASE_URL}/publishing/contracts/publishing`, {
            headers: token ? { 'Authorization': `Bearer ${token}` } : {},
            credentials: 'include'
        });
        return parseResponse(res);
    },
    deletePublishingContract: async (token: string, id: number) => {
        const res = await fetch(`${API_BASE_URL}/publishing/contracts/publishing/${id}`, {
            method: 'DELETE',
            headers: token ? { 'Authorization': `Bearer ${token}` } : {},
            credentials: 'include'
        });
        return parseResponse(res);
    },

    // User Profile
    getProfile: async (token) => {
        const res = await fetch(`${API_BASE_URL}/users/profile`, {
            headers: token ? { 'Authorization': `Bearer ${token}` } : {},
            credentials: 'include'
        });
        return parseResponse(res);
    },

    updateProfile: async (token, data) => {
        const formData = new FormData();
        if (data.username) formData.append('username', data.username);
        if (data.email) formData.append('email', data.email);
        if (data.password) formData.append('password', data.password);
        if (data.profilePicture instanceof File) {
            formData.append('profilePicture', data.profilePicture);
        }

        const res = await fetch(`${API_BASE_URL}/users/profile`, {
            method: 'PUT',
            headers: { 
                ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            },
            body: formData,
            credentials: 'include'
        });

        return parseResponse(res);
    },

    uploadUserDoc: async (token, type, file) => {
        const formData = new FormData();
        formData.append('type', type);
        formData.append('file', file);

        const res = await fetch(`${API_BASE_URL}/users/upload-doc`, {
            method: 'POST',
            headers: token ? { 'Authorization': `Bearer ${token}` } : {},
            body: formData,
            credentials: 'include'
        });

        return parseResponse(res);
    },

    // Songwriters removed
    
    // Settings
    getBranding: async () => {
        const res = await fetch(`${API_BASE_URL}/settings/branding`, {
            credentials: 'include'
        });
        if (!res.ok) throw new Error('Failed to fetch branding');
        return res.json();
    },

    updateBranding: async (token, formData: FormData) => {
        const res = await fetch(`${API_BASE_URL}/settings/branding`, {
            method: 'PUT',
            headers: { 
                'Authorization': `Bearer ${token}`
            },
            body: formData,
            credentials: 'include'
        });
        return parseResponse(res);
    },

    getAggregators: async (token) => {
        const res = await fetch(`${API_BASE_URL}/settings/aggregators`, {
            headers: { ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
            credentials: 'include'
        });
        if (!res.ok) throw new Error('Failed to fetch aggregators');
        return res.json();
    },

    updateAggregators: async (token, aggregators) => {
        const res = await fetch(`${API_BASE_URL}/settings/aggregators`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ aggregators })
        });
        if (!res.ok) throw new Error('Failed to update aggregators');
        return res.json();
    },

    // Gateway Settings (SMTP & MPWA)
    getGatewaySettings: async (token: string) => {
        const res = await fetch(`${API_BASE_URL}/settings/gateway`, {
            headers: token ? { 'Authorization': `Bearer ${token}` } : {},
            credentials: 'include'
        });
        return parseResponse(res);
    },
    updateGatewaySettings: async (token: string, payload: { smtp?: any; mpwa?: any }) => {
        const res = await fetch(`${API_BASE_URL}/settings/gateway`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            },
            body: JSON.stringify(payload),
            credentials: 'include'
        });
        return parseResponse(res);
    },
    testGatewayEmail: async (token: string, payload: { to: string; subject?: string; body?: string }) => {
        const res = await fetch(`${API_BASE_URL}/settings/gateway/test-email`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            },
            body: JSON.stringify(payload),
            credentials: 'include'
        });
        return parseResponse(res);
    },
    testGatewayWa: async (token: string, payload: { phone: string; message?: string; endpoint?: string }) => {
        const res = await fetch(`${API_BASE_URL}/settings/gateway/test-wa`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            },
            body: JSON.stringify(payload),
            credentials: 'include'
        });
        return parseResponse(res);
    },

    // User Management
    updateUser: async (token, id, data) => {
        const res = await fetch(`${API_BASE_URL}/users/${id}`, {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(data)
        });
        if (!res.ok) {
             const json = await res.json().catch(() => ({}));
             throw new Error(json.error || 'Failed to update user');
        }
        return res.json();
    },

    getUsers: async (token) => {
        const res = await fetch(`${API_BASE_URL}/users`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Failed to fetch users');
        const json = await res.json();
        if (Array.isArray(json)) return json;
        if (Array.isArray((json as any).users)) return (json as any).users;
        if (Array.isArray((json as any).data)) return (json as any).data;
        return [];
    },
    getUser: async (token, id) => {
        const res = await fetch(`${API_BASE_URL}/users/${id}`, {
            headers: { 'Authorization': `Bearer ${token}` },
            credentials: 'include'
        });
        return parseResponse(res);
    },
    impersonateUser: async (token, id) => {
        const res = await fetch(`${API_BASE_URL}/users/${id}/impersonate`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            credentials: 'include'
        });
        return parseResponse(res);
    },

    createUser: async (token, userData) => {
        const res = await fetch(`${API_BASE_URL}/users`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(userData)
        });
        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.message || 'Failed to create user');
        }
        return res.json();
    },

    deleteUser: async (token, userId) => {
        const res = await fetch(`${API_BASE_URL}/users/${userId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) {
             const err = await res.json();
             throw new Error(err.error || 'Failed to delete user');
        }
        return res.json();
    },
    
    updateUserStatus: async (token, userId, status, reason?: string, aggregatorPercentage?: number, publishingPercentage?: number, contractStatus?: string, contractDocPath?: string) => {
        const res = await fetch(`${API_BASE_URL}/users/${userId}/status`, {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ 
                status, 
                reason, 
                aggregator_percentage: aggregatorPercentage, 
                publishing_percentage: publishingPercentage,
                contract_status: contractStatus,
                contract_doc_path: contractDocPath 
            }),
            credentials: 'include'
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({} as any));
            throw new Error((err as any).error || 'Failed to update status');
        }
        return res.json();
    },

    // Tickets
    tickets: {
        list: async (token) => {
            const res = await fetch(`${API_BASE_URL}/tickets`, {
                headers: token ? { 'Authorization': `Bearer ${token}` } : {},
                credentials: 'include'
            });
            return parseResponse(res);
        },
        create: async (token, data) => {
            const res = await fetch(`${API_BASE_URL}/tickets`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                },
                body: JSON.stringify(data),
                credentials: 'include'
            });
            return parseResponse(res);
        },
        get: async (token, id) => {
            const res = await fetch(`${API_BASE_URL}/tickets/${id}`, {
                headers: token ? { 'Authorization': `Bearer ${token}` } : {},
                credentials: 'include'
            });
            return parseResponse(res);
        },
        reply: async (token, id, message) => {
            const res = await fetch(`${API_BASE_URL}/tickets/${id}/reply`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                },
                body: JSON.stringify({ message }),
                credentials: 'include'
            });
            return parseResponse(res);
        },
        close: async (token, id) => {
            const res = await fetch(`${API_BASE_URL}/tickets/${id}/close`, {
                method: 'PUT',
                headers: token ? { 'Authorization': `Bearer ${token}` } : {},
                credentials: 'include'
            });
            return parseResponse(res);
        }
    },
    spotify: {
        getArtistByLink: async (link: string) => {
            const params = new URLSearchParams();
            params.append('url', link);
            const res = await fetch(`${API_BASE_URL}/spotify/artist?${params.toString()}`, {
                method: 'GET',
                credentials: 'include'
            });
            return parseResponse(res);
        },
        searchArtist: async (q: string, limit = 5) => {
            const params = new URLSearchParams();
            params.append('q', q);
            params.append('limit', String(limit));
            const res = await fetch(`${API_BASE_URL}/spotify/search?${params.toString()}`, {
                method: 'GET',
                credentials: 'include'
            });
            return parseResponse(res);
        }
    }
};
