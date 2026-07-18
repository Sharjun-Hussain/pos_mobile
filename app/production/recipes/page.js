"use client";

import React, { useState } from 'react';
import {
  Search,
  FileText,
  Menu,
  RefreshCcw,
  ChevronRight,
  Plus,
  CheckCircle2,
  X,
  Trash2,
  Edit3,
  Box
} from 'lucide-react';
import { haptics } from '@/services/haptics';
import { useUIStore } from '@/store/useUIStore';
import { useFetch } from '@/hooks/useFetch';
import { api } from '@/services/api';
import { Drawer } from 'vaul';

const RecipeRow = ({ recipe, onClick }) => {
  return (
    <div 
      onClick={() => { haptics.light(); onClick(recipe); }}
      className="flex items-center justify-between py-3 border-b border-glass-border/30 px-1 active:bg-brand/5 transition-colors cursor-pointer"
    >
      <div className="flex items-center gap-3 overflow-hidden">
        <div className="h-10 w-10 rounded-lg bg-surface-muted flex items-center justify-center flex-shrink-0 overflow-hidden border border-glass-border/20">
          <FileText size={18} className="text-text-secondary opacity-50" />
        </div>
        <div className="overflow-hidden">
          <h4 className="font-bold text-text-main text-sm truncate leading-tight mb-0.5">{recipe.name || 'Unnamed Recipe'}</h4>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-text-secondary opacity-60">
              {recipe.product?.name || 'Unknown Product'}
            </span>
          </div>
        </div>
      </div>
      <ChevronRight size={16} className="text-text-secondary opacity-30" />
    </div>
  );
};

export default function RecipesPage() {
  const { openDrawer } = useUIStore();
  const { data: recipesData, isLoading, error, mutate } = useFetch('/recipes?size=5000');
  const { data: productsData } = useFetch('/products/active/list');
  const { data: rawMaterialsData } = useFetch('/products?type=raw_material&size=5000');
  
  const [searchTerm, setSearchTerm] = useState('');
  
  // Drawer states
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState('add'); // 'add', 'view', 'edit'
  
  const [currentRecipe, setCurrentRecipe] = useState({ name: '', product_id: '', ingredients: [] });
  const [newIngredient, setNewIngredient] = useState({ raw_material_id: '', quantity: '' });
  
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const recipes = recipesData?.data || recipesData || [];
  const products = productsData?.data || productsData || [];
  const rawMaterials = rawMaterialsData?.data || rawMaterialsData || [];

  const handleOpenAdd = () => {
    haptics.medium();
    setDrawerMode('add');
    setCurrentRecipe({ name: '', product_id: '', ingredients: [] });
    setNewIngredient({ raw_material_id: '', quantity: '' });
    setIsDrawerOpen(true);
  };

  const handleOpenView = (recipe) => {
    setDrawerMode('view');
    // Ensure ingredients are properly formatted
    setCurrentRecipe({ 
      ...recipe, 
      product_id: recipe.product_id || recipe.product?.id || '',
      ingredients: recipe.ingredients || []
    });
    setNewIngredient({ raw_material_id: '', quantity: '' });
    setIsDrawerOpen(true);
  };

  const handleOpenEdit = () => {
    haptics.light();
    setDrawerMode('edit');
  };

  const handleAddIngredient = () => {
    if (!newIngredient.raw_material_id || !newIngredient.quantity) return;
    haptics.light();
    
    const mat = rawMaterials.find(r => r.id.toString() === newIngredient.raw_material_id.toString());
    const ingredientName = mat ? mat.name : 'Unknown Material';
    
    setCurrentRecipe({
      ...currentRecipe,
      ingredients: [
        ...currentRecipe.ingredients, 
        { 
          raw_material_id: newIngredient.raw_material_id, 
          quantity: Number(newIngredient.quantity),
          name: ingredientName // just for display
        }
      ]
    });
    setNewIngredient({ raw_material_id: '', quantity: '' });
  };

  const handleRemoveIngredient = (index) => {
    haptics.light();
    const newIngredients = [...currentRecipe.ingredients];
    newIngredients.splice(index, 1);
    setCurrentRecipe({ ...currentRecipe, ingredients: newIngredients });
  };

  const handleSave = async () => {
    if (!currentRecipe.name || !currentRecipe.product_id || currentRecipe.ingredients.length === 0) return;
    setIsSaving(true);
    haptics.medium();
    
    // Clean up payload (remove display-only fields like name from ingredients)
    const payload = {
      name: currentRecipe.name,
      product_id: currentRecipe.product_id,
      ingredients: currentRecipe.ingredients.map(i => ({
        raw_material_id: i.raw_material_id || i.raw_material?.id,
        quantity: Number(i.quantity)
      }))
    };

    try {
      if (drawerMode === 'add') {
        await api.productionRecipes.create(payload);
      } else if (drawerMode === 'edit') {
        await api.productionRecipes.update(currentRecipe.id, payload);
      }
      haptics.heavy();
      setIsDrawerOpen(false);
      mutate();
    } catch (err) {
      console.error('Save Recipe Failed:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!currentRecipe.id) return;
    if (!window.confirm('Are you sure you want to delete this recipe?')) return;
    
    setIsDeleting(true);
    haptics.medium();
    try {
      await api.productionRecipes.delete(currentRecipe.id);
      haptics.heavy();
      setIsDrawerOpen(false);
      mutate();
    } catch (err) {
      console.error('Delete Recipe Failed:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredRecipes = Array.isArray(recipes) ? recipes.filter(r => 
    r.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.product?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  ) : [];

  const totalCount = recipesData?.meta?.total || recipesData?.total || recipes.length;

  return (
    <div className="px-4 pb-24 flex flex-col gap-5 min-h-screen bg-surface">
      <header className="sticky top-0 z-40 bg-surface/90 backdrop-blur-xl pt-[calc(var(--sat)+1rem)] pb-3 -mx-4 px-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <button
            onClick={() => { haptics.light(); openDrawer(); }}
            className="h-[42px] w-[42px] flex items-center justify-center text-text-main active:scale-90 transition-transform ml-[-10px]"
          >
            <Menu size={24} strokeWidth={2.5} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-text-main leading-none mb-1">Recipes</h1>
              <span className="px-2 py-0.5 rounded-md bg-brand/10 text-brand text-[10px] font-black">
                {searchTerm ? `${filteredRecipes.length} / ${totalCount}` : totalCount}
              </span>
            </div>
            <p className="text-[11px] font-semibold text-text-secondary leading-none opacity-70">Bill of Quantities (BOM)</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => { haptics.light(); mutate(); }}
            className="h-10 w-10 border border-glass-border/30 rounded-xl flex items-center justify-center text-text-secondary active:scale-95 transition-transform hover:text-brand bg-surface-muted shadow-sm"
          >
            <RefreshCcw size={16} className={isLoading ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={handleOpenAdd}
            className="h-10 w-10 bg-brand text-white rounded-xl flex items-center justify-center active:scale-95 transition-transform shadow-sm shadow-brand/30"
          >
            <Plus size={18} strokeWidth={3} />
          </button>
        </div>
      </header>

      <section className="flex flex-col gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-secondary opacity-40" size={16} />
          <input
            type="text"
            placeholder="Search recipes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-12 bg-surface-muted border border-glass-border/30 rounded-xl pl-11 pr-4 text-sm font-medium text-text-main outline-none focus:border-brand/40 focus:bg-surface transition-all placeholder:text-text-secondary/40"
          />
        </div>
      </section>

      <section className="flex flex-col">
        <div className="flex items-center justify-between mb-3 px-1 border-b border-glass-border/30 pb-2">
          <h2 className="text-xs font-black text-text-secondary opacity-30">
            {isLoading ? 'Loading Recipes...' : `${filteredRecipes.length} results`}
          </h2>
        </div>

        {isLoading ? (
          <div className="flex flex-col">
            {Array(5).fill(0).map((_, i) => (
              <div key={i} className="h-14 w-full border-b border-glass-border/10 animate-pulse bg-surface-muted" />
            ))}
          </div>
        ) : filteredRecipes.length > 0 ? (
          <div className="flex flex-col">
            {filteredRecipes.map(recipe => (
              <RecipeRow key={recipe.id} recipe={recipe} onClick={handleOpenView} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 opacity-20">
            <FileText size={40} strokeWidth={1} />
            <p className="text-[11px] font-bold mt-4">No recipes found</p>
          </div>
        )}
      </section>

      <Drawer.Root open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-md z-[300]" />
          <Drawer.Content className="fixed bottom-0 left-0 right-0 bg-surface rounded-t-[2.5rem] flex flex-col z-[301] shadow-2xl outline-none max-h-[90dvh]">
            <div className="mx-auto w-14 h-1.5 flex-shrink-0 rounded-full bg-text-secondary/20 mt-4 mb-2" />
            
            <div className="flex flex-col overflow-y-auto no-scrollbar p-6 pb-2 flex-1">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-xl font-bold text-text-main">
                    {drawerMode === 'add' ? 'New Recipe' : drawerMode === 'edit' ? 'Edit Recipe' : currentRecipe.name || 'Recipe Details'}
                  </h3>
                  <p className="text-xs font-bold text-text-secondary opacity-40">
                    {drawerMode === 'view' ? (currentRecipe.product?.name || 'Finished Good') : 'Bill of Quantities'}
                  </p>
                </div>
                <div className="flex gap-2">
                  {drawerMode === 'view' && (
                    <>
                      <button
                        onClick={handleDelete}
                        disabled={isDeleting}
                        className="h-10 w-10 bg-rose-500/10 text-rose-500 rounded-xl border border-rose-500/20 flex items-center justify-center active:scale-95 transition-transform"
                      >
                        {isDeleting ? <RefreshCcw size={16} className="animate-spin" /> : <Trash2 size={16} />}
                      </button>
                      <button
                        onClick={handleOpenEdit}
                        className="h-10 w-10 bg-surface-muted rounded-xl border border-glass-border/20 flex items-center justify-center text-text-main active:scale-95 transition-transform"
                      >
                        <Edit3 size={16} />
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => setIsDrawerOpen(false)}
                    className="h-10 w-10 bg-surface-muted rounded-xl border border-glass-border/20 flex items-center justify-center text-text-secondary active:rotate-90 transition-transform"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              {drawerMode === 'view' ? (
                <div className="flex flex-col gap-6">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-black text-text-secondary uppercase tracking-wider opacity-50">Target Product</span>
                    <span className="text-sm font-bold text-text-main">{currentRecipe.product?.name || 'N/A'}</span>
                  </div>
                  
                  <div className="flex flex-col gap-3">
                    <span className="text-[10px] font-black text-text-secondary uppercase tracking-wider opacity-50 border-b border-glass-border/30 pb-2">Ingredients</span>
                    {currentRecipe.ingredients && currentRecipe.ingredients.length > 0 ? (
                      currentRecipe.ingredients.map((ing, i) => (
                        <div key={i} className="flex items-center justify-between py-2 border-b border-glass-border/10 last:border-0">
                          <div className="flex items-center gap-2">
                            <Box size={16} className="text-text-secondary opacity-40" />
                            <span className="text-sm font-bold text-text-main">{ing.raw_material?.name || ing.name || 'Unknown Material'}</span>
                          </div>
                          <span className="text-sm font-bold text-brand bg-brand/10 px-2 py-0.5 rounded-md">Qty: {ing.quantity}</span>
                        </div>
                      ))
                    ) : (
                      <span className="text-sm font-bold text-text-secondary opacity-50 italic">No ingredients found.</span>
                    )}
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex flex-col gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-black text-text-secondary pl-1 opacity-70 uppercase tracking-widest">Recipe Name*</label>
                      <input
                        type="text"
                        placeholder="E.g., Large Pizza Dough"
                        value={currentRecipe.name}
                        onChange={(e) => setCurrentRecipe({ ...currentRecipe, name: e.target.value })}
                        className="w-full h-14 bg-surface-muted border border-glass-border/30 rounded-2xl px-4 text-sm font-bold text-text-main outline-none focus:border-brand/40 focus:ring-4 focus:ring-brand/5 transition-all"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-black text-text-secondary pl-1 opacity-70 uppercase tracking-widest">Target Finished Good*</label>
                      <div className="relative">
                        <select
                          value={currentRecipe.product_id}
                          onChange={(e) => setCurrentRecipe({ ...currentRecipe, product_id: e.target.value })}
                          className="w-full h-14 bg-surface-muted border border-glass-border/30 rounded-2xl px-4 text-sm font-bold text-text-main outline-none focus:border-brand/40 focus:ring-4 focus:ring-brand/5 transition-all appearance-none"
                        >
                          <option value="">-- Choose Product --</option>
                          {products.map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                          ))}
                        </select>
                        <ChevronRight size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-text-secondary opacity-40 rotate-90 pointer-events-none" />
                      </div>
                    </div>

                    <div className="mt-4 border-t border-glass-border/30 pt-4">
                      <label className="text-[11px] font-black text-text-secondary pl-1 opacity-70 uppercase tracking-widest mb-2 block">Ingredients</label>
                      
                      {/* Ingredient List */}
                      {currentRecipe.ingredients.length > 0 && (
                        <div className="flex flex-col gap-2 mb-4 bg-surface-muted/50 p-2 rounded-2xl border border-glass-border/20">
                          {currentRecipe.ingredients.map((ing, i) => (
                            <div key={i} className="flex items-center justify-between bg-surface p-3 rounded-xl border border-glass-border/30 shadow-sm">
                              <div className="flex items-center gap-2 overflow-hidden">
                                <Box size={16} className="text-text-secondary opacity-40 flex-shrink-0" />
                                <span className="text-sm font-bold text-text-main truncate">{ing.raw_material?.name || ing.name || 'Unknown'}</span>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="text-[13px] font-bold text-brand bg-brand/10 px-2 py-0.5 rounded">x{ing.quantity}</span>
                                <button onClick={() => handleRemoveIngredient(i)} className="text-rose-500/70 p-1 active:scale-90">
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Add Ingredient Form */}
                      <div className="flex flex-col gap-2 bg-surface-muted p-3 rounded-2xl border border-brand/20">
                        <div className="relative">
                          <select
                            value={newIngredient.raw_material_id}
                            onChange={(e) => setNewIngredient({ ...newIngredient, raw_material_id: e.target.value })}
                            className="w-full h-12 bg-surface border border-glass-border/30 rounded-xl px-3 text-sm font-bold text-text-main outline-none appearance-none"
                          >
                            <option value="">Select Raw Material</option>
                            {rawMaterials.map(rm => (
                              <option key={rm.id} value={rm.id}>{rm.name}</option>
                            ))}
                          </select>
                          <ChevronRight size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary opacity-40 rotate-90 pointer-events-none" />
                        </div>
                        <div className="flex gap-2">
                          <input
                            type="number"
                            min="0.1"
                            step="0.1"
                            placeholder="Qty"
                            value={newIngredient.quantity}
                            onChange={(e) => setNewIngredient({ ...newIngredient, quantity: e.target.value })}
                            className="flex-1 h-12 bg-surface border border-glass-border/30 rounded-xl px-3 text-sm font-bold text-text-main outline-none focus:border-brand/40"
                          />
                          <button
                            onClick={handleAddIngredient}
                            disabled={!newIngredient.raw_material_id || !newIngredient.quantity}
                            className="h-12 px-6 bg-brand text-white rounded-xl text-sm font-bold disabled:opacity-50 active:scale-95 transition-all shadow-md shadow-brand/20"
                          >
                            Add
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
            
            {drawerMode !== 'view' && (
              <div className="px-6 pt-4 pb-[calc(var(--sab)+1.5rem)] bg-surface border-t border-glass-border/10 flex-shrink-0">
                <button
                  onClick={handleSave}
                  disabled={!currentRecipe.name || !currentRecipe.product_id || currentRecipe.ingredients.length === 0 || isSaving}
                  className="w-full h-14 bg-brand text-white rounded-2xl font-bold shadow-xl shadow-brand/20 flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-70"
                >
                  {isSaving ? (
                    <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <CheckCircle2 size={18} strokeWidth={2.5} />
                      <span>{drawerMode === 'add' ? 'Create Recipe' : 'Save Changes'}</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    </div>
  );
}
