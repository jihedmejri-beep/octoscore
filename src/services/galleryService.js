import api, { API_ORIGIN } from "./api";

export const fetchGallery = () => api.get("/gallery").then((r) => r.data);

// Public forced-download endpoint (302 → Cloudinary attachment URL).
export const galleryDownloadUrl = (id) => `${API_ORIGIN}/api/gallery/${id}/download`;
