import { useState, useEffect, useCallback } from "react";
import "@/App.css";
import { db } from "@/lib/firebase";
import { 
  collection, 
  addDoc, 
  updateDoc,
  deleteDoc,
  doc,
  query, 
  orderBy, 
  onSnapshot,
  serverTimestamp 
} from "firebase/firestore";
import { Music, PenTool, Folder, Save, X, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Toaster, toast } from "sonner";

// Background texture component
const BackgroundTexture = () => (
  <div 
    className="fixed inset-0 opacity-5 mix-blend-overlay pointer-events-none z-0"
    style={{
      backgroundImage: `url('https://images.unsplash.com/photo-1769270803802-16ff88f01744?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NjZ8MHwxfHNlYXJjaHwyfHxkYXJrJTIwY3JlYXRpdmUlMjBtdXNpYyUyMHN0dWRpbyUyMGFic3RyYWN0JTIwdGV4dHVyZXxlbnwwfHx8fDE3NzI0MTI4MzF8MA&ixlib=rb-4.1.0&q=85')`,
      backgroundSize: 'cover',
      backgroundPosition: 'center'
    }}
  />
);

// Loading skeleton for song cards
const SongCardSkeleton = () => (
  <div className="p-6 rounded-xl border border-[#27272A] bg-[#121212]">
    <div className="skeleton h-8 w-3/4 rounded mb-4" />
    <div className="skeleton h-4 w-full rounded mb-2" />
    <div className="skeleton h-4 w-2/3 rounded mb-4" />
    <div className="skeleton h-4 w-1/3 rounded" />
  </div>
);

// Song Card Component
const SongCard = ({ song, onEdit, onDelete }) => (
  <div 
    data-testid={`song-card-${song.id}`}
    className="p-6 rounded-xl border border-[#27272A] bg-[#121212] group relative overflow-hidden transition-all duration-300 hover:border-[#D4AF37]/50 hover:shadow-2xl hover:-translate-y-1 cursor-pointer"
    onClick={() => onEdit(song)}
  >
    <h3 
      className="font-serif text-2xl mb-2 group-hover:text-[#D4AF37] transition-colors truncate"
      title={song.title}
    >
      {song.title}
    </h3>
    <p className="font-mono text-sm text-gray-500 line-clamp-3 mb-4 whitespace-pre-wrap">
      {song.lyrics}
    </p>
    <div className="flex justify-between items-center mt-auto border-t border-[#27272A] pt-4">
      <span className="text-xs text-[#D4AF37] bg-[#D4AF37]/10 px-3 py-1 rounded-full flex items-center gap-1">
        <Folder className="w-3 h-3" />
        {song.category}
      </span>
      <Button
        data-testid={`delete-song-${song.id}`}
        variant="ghost"
        size="sm"
        className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-500 hover:text-red-500 hover:bg-red-500/10"
        onClick={(e) => {
          e.stopPropagation();
          onDelete(song);
        }}
      >
        <Trash2 className="w-4 h-4" />
      </Button>
    </div>
  </div>
);

// Category Tab Component
const CategoryTab = ({ category, isActive, onClick }) => (
  <button
    data-testid={`category-tab-${category.toLowerCase().replace(/\s+/g, '-')}`}
    onClick={onClick}
    className={`px-5 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-300 ${
      isActive
        ? "bg-[#D4AF37] text-black shadow-[0_0_15px_rgba(212,175,55,0.3)] border-transparent"
        : "bg-[#1A1A1A] text-gray-400 border border-[#27272A] hover:border-[#D4AF37]/50 hover:text-white"
    }`}
  >
    {category}
  </button>
);

// Lyrics Editor Modal
const LyricsEditor = ({ 
  isOpen, 
  onClose, 
  song, 
  categories, 
  onSave 
}) => {
  const [title, setTitle] = useState("");
  const [lyrics, setLyrics] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [newCategoryName, setNewCategoryName] = useState("");
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (song) {
      setTitle(song.title || "");
      setLyrics(song.lyrics || "");
      setSelectedCategory(song.category || "");
    } else {
      setTitle("");
      setLyrics("");
      setSelectedCategory("");
    }
    setNewCategoryName("");
    setIsCreatingCategory(false);
  }, [song, isOpen]);

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error("Please enter a title");
      return;
    }
    if (!lyrics.trim()) {
      toast.error("Please enter lyrics");
      return;
    }
    
    let finalCategory = selectedCategory;
    if (isCreatingCategory) {
      if (!newCategoryName.trim()) {
        toast.error("Please enter a category name");
        return;
      }
      finalCategory = newCategoryName.trim();
    }
    
    if (!finalCategory) {
      toast.error("Please select or create a category");
      return;
    }

    setIsSaving(true);
    try {
      await onSave({
        id: song?.id,
        title: title.trim(),
        lyrics: lyrics.trim(),
        category: finalCategory
      });
      onClose();
    } catch (error) {
      toast.error("Failed to save lyrics");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCategoryChange = (value) => {
    if (value === "__create_new__") {
      setIsCreatingCategory(true);
      setSelectedCategory("");
    } else {
      setIsCreatingCategory(false);
      setSelectedCategory(value);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        data-testid="lyrics-editor-modal"
        className="bg-[#0A0A0A]/95 backdrop-blur-xl border border-[#27272A] max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col"
      >
        <DialogHeader className="border-b border-[#27272A] pb-4">
          <DialogTitle className="text-2xl font-serif text-[#EAEAEA]">
            {song?.id ? "Edit Lyrics" : "Create New Lyrics"}
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto custom-scrollbar py-4 space-y-6">
          <Input
            data-testid="lyrics-title-input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Song Title..."
            className="bg-transparent border-none text-3xl md:text-4xl font-serif font-bold placeholder:text-gray-700 focus-visible:ring-0 focus-visible:ring-offset-0 px-0 w-full h-auto"
          />
          
          <Textarea
            data-testid="lyrics-content-input"
            value={lyrics}
            onChange={(e) => setLyrics(e.target.value)}
            placeholder="Start writing your lyrics..."
            className="bg-transparent border-none text-lg font-mono text-gray-300 focus-visible:ring-0 focus-visible:ring-offset-0 px-0 w-full resize-none min-h-[40vh] leading-loose custom-scrollbar placeholder:text-gray-700"
          />

          <div className="space-y-3 pt-4 border-t border-[#27272A]">
            <label className="text-sm text-gray-400">Category</label>
            <Select 
              value={isCreatingCategory ? "__create_new__" : selectedCategory} 
              onValueChange={handleCategoryChange}
            >
              <SelectTrigger 
                data-testid="category-select-trigger"
                className="w-full bg-[#1A1A1A] border-[#27272A] text-white"
              >
                <SelectValue placeholder="Select a category..." />
              </SelectTrigger>
              <SelectContent className="bg-[#1A1A1A] border-[#27272A]">
                {categories.map((cat) => (
                  <SelectItem 
                    key={cat} 
                    value={cat}
                    className="text-white hover:bg-[#27272A] focus:bg-[#27272A]"
                  >
                    {cat}
                  </SelectItem>
                ))}
                <SelectItem 
                  value="__create_new__"
                  className="text-[#D4AF37] hover:bg-[#27272A] focus:bg-[#27272A]"
                >
                  <span className="flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    Create New Category
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>

            {isCreatingCategory && (
              <Input
                data-testid="new-category-input"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Enter new category name..."
                className="bg-[#1A1A1A] border-[#27272A] text-white"
                autoFocus
              />
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-[#27272A]">
          <Button
            data-testid="cancel-lyrics-btn"
            variant="ghost"
            onClick={onClose}
            className="text-gray-400 hover:text-white hover:bg-[#27272A]"
          >
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
          <Button
            data-testid="save-lyrics-btn"
            onClick={handleSave}
            disabled={isSaving}
            className="bg-[#D4AF37] text-black font-semibold hover:bg-[#F2C94C] shadow-lg shadow-[#D4AF37]/20"
          >
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? "Saving..." : "Save Lyrics"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Main App Component
function App() {
  const [songs, setSongs] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState("All");
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingSong, setEditingSong] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // Fetch songs from Firestore
  useEffect(() => {
    const q = query(collection(db, "lyrics"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const songsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setSongs(songsData);
      
      // Extract unique categories
      const uniqueCategories = [...new Set(songsData.map(s => s.category).filter(Boolean))];
      setCategories(uniqueCategories);
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching songs:", error);
      toast.error("Failed to load songs");
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Filter songs by category
  const filteredSongs = activeCategory === "All" 
    ? songs 
    : songs.filter(song => song.category === activeCategory);

  // Handle save (create or update)
  const handleSave = async (songData) => {
    try {
      if (songData.id) {
        // Update existing song
        await updateDoc(doc(db, "lyrics", songData.id), {
          title: songData.title,
          lyrics: songData.lyrics,
          category: songData.category,
          updatedAt: serverTimestamp()
        });
        toast.success("Lyrics updated successfully!");
      } else {
        // Create new song
        await addDoc(collection(db, "lyrics"), {
          title: songData.title,
          lyrics: songData.lyrics,
          category: songData.category,
          createdAt: serverTimestamp()
        });
        toast.success("Lyrics saved successfully!");
      }
    } catch (error) {
      console.error("Error saving song:", error);
      throw error;
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await deleteDoc(doc(db, "lyrics", deleteConfirm.id));
      toast.success("Lyrics deleted successfully!");
      setDeleteConfirm(null);
    } catch (error) {
      console.error("Error deleting song:", error);
      toast.error("Failed to delete lyrics");
    }
  };

  // Open editor for new song
  const handleNewSong = () => {
    setEditingSong(null);
    setIsEditorOpen(true);
  };

  // Open editor for editing
  const handleEditSong = (song) => {
    setEditingSong(song);
    setIsEditorOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#050505] relative">
      <BackgroundTexture />
      <Toaster 
        position="top-right" 
        richColors 
        theme="dark"
        toastOptions={{
          style: {
            background: '#121212',
            border: '1px solid #27272A',
          }
        }}
      />
      
      {/* Header */}
      <header className="relative z-10 border-b border-[#27272A] bg-[#050505]/80 backdrop-blur-md sticky top-0">
        <div className="max-w-7xl mx-auto px-6 md:px-12 py-6 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Music className="w-8 h-8 text-[#D4AF37]" />
            <h1 className="text-2xl md:text-3xl font-serif font-bold tracking-tight">
              Lyrics <span className="text-[#D4AF37]">Studio</span>
            </h1>
          </div>
          <Button
            data-testid="create-new-btn"
            onClick={handleNewSong}
            className="bg-[#D4AF37] text-black font-semibold hover:bg-[#F2C94C] shadow-lg shadow-[#D4AF37]/20"
          >
            <PenTool className="w-4 h-4 mr-2" />
            New Lyrics
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 md:px-12 py-8">
        {/* Category Tabs */}
        <div className="flex overflow-x-auto pb-4 gap-3 no-scrollbar mb-8">
          <CategoryTab
            category="All"
            isActive={activeCategory === "All"}
            onClick={() => setActiveCategory("All")}
          />
          {categories.map((category) => (
            <CategoryTab
              key={category}
              category={category}
              isActive={activeCategory === category}
              onClick={() => setActiveCategory(category)}
            />
          ))}
        </div>

        {/* Songs Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <SongCardSkeleton key={i} />
            ))}
          </div>
        ) : filteredSongs.length === 0 ? (
          <div className="text-center py-20">
            <Music className="w-16 h-16 text-[#27272A] mx-auto mb-4" />
            <h3 className="text-xl font-serif text-gray-500 mb-2">
              {activeCategory === "All" 
                ? "No lyrics yet" 
                : `No lyrics in "${activeCategory}"`}
            </h3>
            <p className="text-gray-600 mb-6">
              Start creating your first song lyrics
            </p>
            <Button
              data-testid="empty-state-create-btn"
              onClick={handleNewSong}
              className="bg-[#D4AF37] text-black font-semibold hover:bg-[#F2C94C]"
            >
              <PenTool className="w-4 h-4 mr-2" />
              Create Lyrics
            </Button>
          </div>
        ) : (
          <div 
            data-testid="songs-grid"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {filteredSongs.map((song) => (
              <SongCard
                key={song.id}
                song={song}
                onEdit={handleEditSong}
                onDelete={setDeleteConfirm}
              />
            ))}
          </div>
        )}
      </main>

      {/* Lyrics Editor Modal */}
      <LyricsEditor
        isOpen={isEditorOpen}
        onClose={() => {
          setIsEditorOpen(false);
          setEditingSong(null);
        }}
        song={editingSong}
        categories={categories}
        onSave={handleSave}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent className="bg-[#121212] border-[#27272A]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[#EAEAEA]">Delete Lyrics?</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              Are you sure you want to delete "{deleteConfirm?.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel 
              data-testid="cancel-delete-btn"
              className="bg-[#27272A] text-white border-[#27272A] hover:bg-[#3F3F46]"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              data-testid="confirm-delete-btn"
              onClick={handleDelete}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default App;
