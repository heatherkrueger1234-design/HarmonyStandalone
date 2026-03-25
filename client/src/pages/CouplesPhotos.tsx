import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Heart, Upload, X, Star, Image as ImageIcon, Play, Pause, ArrowLeft, Camera } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useLocation } from "wouter";

interface CouplesPhoto {
  id: string;
  therapySessionId: string;
  photoUrl: string;
  thumbnailUrl: string | null;
  uploadedBy: string;
  uploadType: string;
  isFavorite: boolean;
  caption: string | null;
  tags: string[];
  uploadedAt: string;
}

export default function CouplesPhotos() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [therapyId, setTherapyId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string>("");
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [showWallpaper, setShowWallpaper] = useState(false);
  const [wallpaperPlaying, setWallpaperPlaying] = useState(false);
  const [currentWallpaperIndex, setCurrentWallpaperIndex] = useState(0);
  const [selectedPhoto, setSelectedPhoto] = useState<CouplesPhoto | null>(null);
  const [caption, setCaption] = useState("");
  const [uploadType, setUploadType] = useState<"individual" | "mutual">("individual");

  // Get therapy ID from query params and user email from session
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tid = params.get('therapyId');
    if (tid) setTherapyId(tid);

    // Fetch user email from session
    fetch('/api/auth/user', { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (data.email) setUserEmail(data.email);
      })
      .catch(() => {
        // User not logged in, use query param email if available
        const email = params.get('email');
        if (email) setUserEmail(email);
      });
  }, []);

  // Fetch photos
  const { data: photosData } = useQuery({
    queryKey: ['/api/couples/photos', therapyId],
    queryFn: async () => {
      if (!therapyId) return { photos: [] };
      const res = await fetch(`/api/couples/photos/${therapyId}`, {
        credentials: 'include'
      });
      if (!res.ok) throw new Error('Failed to fetch photos');
      return res.json();
    },
    enabled: !!therapyId
  });

  const photos: CouplesPhoto[] = photosData?.photos || [];
  const favoritePhotos = photos.filter(p => p.isFavorite);

  // Upload photo mutation
  const uploadPhotoMutation = useMutation({
    mutationFn: async (data: { photoUrl: string, caption: string, uploadType: string }) => {
      if (!therapyId || !userEmail) {
        throw new Error('Missing therapy ID or user email');
      }
      
      const response = await apiRequest("POST", "/api/couples/photos/upload", {
        therapyId,
        photoUrl: data.photoUrl,
        uploadedBy: userEmail,
        uploadType: data.uploadType,
        caption: data.caption,
        isFavorite: false
      });
      
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/couples/photos', therapyId] });
      toast({
        title: "Photo uploaded! 📸",
        description: "Your memory has been saved.",
      });
      setCaption("");
      setUploadingPhoto(false);
    },
    onError: (error: any) => {
      if (process.env.NODE_ENV === 'development') {
        console.error('Photo upload error:', error);
      }
      toast({
        title: "Upload failed",
        description: error.message || "Couldn't upload the photo. Please try again.",
        variant: "destructive"
      });
      setUploadingPhoto(false);
    }
  });

  // Toggle favorite mutation
  const toggleFavoriteMutation = useMutation({
    mutationFn: async (data: { photoId: string, isFavorite: boolean }) => {
      return await apiRequest("PATCH", `/api/couples/photos/${data.photoId}/favorite`, {
        isFavorite: data.isFavorite
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/couples/photos', therapyId] });
    }
  });

  // Delete photo mutation
  const deletePhotoMutation = useMutation({
    mutationFn: async (photoId: string) => {
      return await apiRequest("DELETE", `/api/couples/photos/${photoId}`, undefined);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/couples/photos', therapyId] });
      toast({
        title: "Photo deleted",
        description: "The photo has been removed.",
      });
    }
  });

  // Handle paste from clipboard
  const handlePaste = async (e: ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const blob = items[i].getAsFile();
        if (blob) {
          await uploadImageBlob(blob);
        }
      }
    }
  };

  // Handle file drop
  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    
    for (let i = 0; i < files.length; i++) {
      if (files[i].type.indexOf('image') !== -1) {
        await uploadImageBlob(files[i]);
      }
    }
  };

  // Upload image blob
  const uploadImageBlob = async (blob: Blob) => {
    setUploadingPhoto(true);
    
    try {
      // Check file size (max 10MB)
      if (blob.size > 10 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please choose an image under 10MB.",
          variant: "destructive"
        });
        setUploadingPhoto(false);
        return;
      }

      // Upload to object storage
      const formData = new FormData();
      formData.append('file', blob);
      
      const uploadResponse = await fetch('/api/object-storage/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });

      if (!uploadResponse.ok) {
        const error = await uploadResponse.text();
        throw new Error(error || 'Upload failed');
      }

      const { url } = await uploadResponse.json();
      
      // Save photo metadata to database
      uploadPhotoMutation.mutate({
        photoUrl: url,
        caption,
        uploadType
      });
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : "Unknown error occurred";
      if (process.env.NODE_ENV === 'development') {
        console.error('Upload error:', error);
      }
      toast({
        title: "Upload failed",
        description: errorMsg || "Couldn't upload the photo. Please try again.",
        variant: "destructive"
      });
      setUploadingPhoto(false);
    }
  };

  // Wallpaper slideshow effect
  useEffect(() => {
    if (!wallpaperPlaying || favoritePhotos.length === 0) return;

    const interval = setInterval(() => {
      setCurrentWallpaperIndex((prev) => 
        (prev + 1) % favoritePhotos.length
      );
    }, 5000); // Change every 5 seconds

    return () => clearInterval(interval);
  }, [wallpaperPlaying, favoritePhotos.length]);

  // Add paste event listener
  useEffect(() => {
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [caption, uploadType]);

  if (!therapyId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/40 to-slate-900 flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-purple-500/30">
            <Camera className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">Couples Photo Gallery</h2>
          <p className="text-white/60 mb-6 leading-relaxed">
            Your shared photo gallery is linked to your couples coaching session. Link with your partner first to unlock this feature.
          </p>
          <div className="flex flex-col gap-3">
            <Button onClick={() => navigate('/harmony-hub')} className="bg-gradient-to-r from-violet-500 to-purple-500 text-white font-bold rounded-full">
              <Heart className="w-4 h-4 mr-2" /> Go to Harmony Hub
            </Button>
            <Button variant="ghost" onClick={() => window.history.back()} className="text-white/60 hover:text-white rounded-full">
              <ArrowLeft className="w-4 h-4 mr-2" /> Go Back
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-teal-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-gray-900 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate('/harmony-hub')}
          className="mb-4 text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-white hover:bg-purple-100 dark:hover:bg-white/10"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Harmony Hub
        </Button>

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-black mb-4 bg-gradient-to-r from-purple-600 via-pink-600 to-teal-600 bg-clip-text text-transparent">
            Our Memories 💕
          </h1>
          <p className="text-lg text-white/50">
            Save your favorite photos together • Relive your love story
          </p>
        </div>

        {/* Upload Zone */}
        <Card 
          className="mb-8 border-2 border-dashed border-purple-300 dark:border-purple-700 bg-white/50 dark:bg-gray-800/50"
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          data-testid="card-upload-zone"
        >
          <CardContent className="p-8">
            <div className="text-center">
              <Upload className="mx-auto h-12 w-12 text-purple-500 mb-4" />
              <h3 className="text-xl font-semibold mb-2">Upload Photos</h3>
              <p className="text-white/50 mb-4">
                Drag & drop images here, paste from clipboard (Ctrl+V), or click to browse
              </p>
              
              <div className="flex gap-4 justify-center mb-4">
                <Button
                  variant={uploadType === "individual" ? "default" : "outline"}
                  onClick={() => setUploadType("individual")}
                  data-testid="button-upload-individual"
                >
                  Individual Upload
                </Button>
                <Button
                  variant={uploadType === "mutual" ? "default" : "outline"}
                  onClick={() => setUploadType("mutual")}
                  data-testid="button-upload-mutual"
                >
                  💑 Mutual Upload
                </Button>
              </div>

              <Input
                type="file"
                accept="image/*"
                multiple
                className="mb-4"
                onChange={(e) => {
                  const files = e.target.files;
                  if (files) {
                    Array.from(files).forEach(uploadImageBlob);
                  }
                }}
                data-testid="input-file-upload"
              />

              <Textarea
                placeholder="Add a caption to your photo..."
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                className="max-w-md mx-auto"
                data-testid="input-caption"
              />

              {uploadingPhoto && (
                <p className="mt-4 text-purple-600 font-semibold" data-testid="text-uploading">
                  Uploading... 📤
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Wallpaper Button */}
        {favoritePhotos.length > 0 && (
          <div className="flex gap-4 justify-center mb-8">
            <Button
              size="lg"
              onClick={() => {
                setShowWallpaper(!showWallpaper);
                setWallpaperPlaying(false);
              }}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              data-testid="button-wallpaper"
            >
              <Heart className="mr-2 h-5 w-5" />
              {showWallpaper ? "Hide" : "Show"} Love Wallpaper ({favoritePhotos.length} favorites)
            </Button>
          </div>
        )}

        {/* Wallpaper Slideshow */}
        {showWallpaper && favoritePhotos.length > 0 && (
          <Card className="mb-8 overflow-hidden border-4 border-pink-300 dark:border-pink-700" data-testid="card-wallpaper">
            <div className="relative h-[500px] bg-black">
              <img
                src={favoritePhotos[currentWallpaperIndex].photoUrl}
                alt="Memory wallpaper"
                className="w-full h-full object-contain"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
                <p className="text-white text-xl text-center mb-4">
                  {favoritePhotos[currentWallpaperIndex].caption || "A cherished memory ❤️"}
                </p>
                <div className="flex justify-center gap-4">
                  <Button
                    onClick={() => setWallpaperPlaying(!wallpaperPlaying)}
                    variant="secondary"
                    data-testid="button-play-pause"
                  >
                    {wallpaperPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                  </Button>
                  <Button
                    onClick={() => setCurrentWallpaperIndex((prev) => 
                      (prev - 1 + favoritePhotos.length) % favoritePhotos.length
                    )}
                    variant="secondary"
                    data-testid="button-prev"
                  >
                    ← Previous
                  </Button>
                  <Button
                    onClick={() => setCurrentWallpaperIndex((prev) => 
                      (prev + 1) % favoritePhotos.length
                    )}
                    variant="secondary"
                    data-testid="button-next"
                  >
                    Next →
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Photo Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {photos.map((photo) => (
            <Card
              key={photo.id}
              className="group relative overflow-hidden cursor-pointer hover:shadow-xl transition-shadow"
              onClick={() => setSelectedPhoto(photo)}
              data-testid={`card-photo-${photo.id}`}
            >
              <div className="aspect-square relative">
                <img
                  src={photo.photoUrl}
                  alt={photo.caption || "Couple memory"}
                  className="w-full h-full object-cover"
                />
                
                {/* Overlay on hover */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <Button
                    size="sm"
                    variant={photo.isFavorite ? "default" : "secondary"}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavoriteMutation.mutate({
                        photoId: photo.id,
                        isFavorite: !photo.isFavorite
                      });
                    }}
                    data-testid={`button-favorite-${photo.id}`}
                  >
                    {photo.isFavorite ? <Heart className="h-4 w-4 fill-current" /> : <Heart className="h-4 w-4" />}
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      deletePhotoMutation.mutate(photo.id);
                    }}
                    data-testid={`button-delete-${photo.id}`}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                {/* Favorite star indicator */}
                {photo.isFavorite && (
                  <Star className="absolute top-2 right-2 h-6 w-6 text-yellow-400 fill-current" />
                )}
              </div>
              
              {photo.caption && (
                <div className="p-2 bg-white dark:bg-gray-800">
                  <p className="text-sm text-white/50 truncate">{photo.caption}</p>
                </div>
              )}
            </Card>
          ))}
        </div>

        {photos.length === 0 && (
          <div className="text-center py-20" data-testid="text-no-photos">
            <ImageIcon className="mx-auto h-20 w-20 text-white/50/30 mb-4" />
            <h3 className="text-xl font-semibold text-white/50 mb-2">
              No photos yet
            </h3>
            <p className="text-white/50">
              Start creating memories together! Upload your first photo above.
            </p>
          </div>
        )}

        {/* Photo Detail Modal */}
        {selectedPhoto && (
          <Dialog open={!!selectedPhoto} onOpenChange={() => setSelectedPhoto(null)}>
            <DialogContent className="max-w-4xl">
              <DialogHeader>
                <DialogTitle>{selectedPhoto.caption || "Memory"}</DialogTitle>
                <DialogDescription>
                  Uploaded {new Date(selectedPhoto.uploadedAt).toLocaleDateString()}
                  {selectedPhoto.uploadType === "mutual" && " • Mutual upload 💑"}
                </DialogDescription>
              </DialogHeader>
              <div className="max-h-[70vh] overflow-auto">
                <img
                  src={selectedPhoto.photoUrl}
                  alt={selectedPhoto.caption || "Memory"}
                  className="w-full h-auto"
                />
              </div>
              <DialogFooter>
                <Button
                  variant={selectedPhoto.isFavorite ? "default" : "outline"}
                  onClick={() => {
                    toggleFavoriteMutation.mutate({
                      photoId: selectedPhoto.id,
                      isFavorite: !selectedPhoto.isFavorite
                    });
                    setSelectedPhoto({ ...selectedPhoto, isFavorite: !selectedPhoto.isFavorite });
                  }}
                  data-testid="button-modal-favorite"
                >
                  {selectedPhoto.isFavorite ? "Remove from" : "Add to"} Favorites
                </Button>
                <Button onClick={() => setSelectedPhoto(null)} data-testid="button-modal-close">
                  Close
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
}
