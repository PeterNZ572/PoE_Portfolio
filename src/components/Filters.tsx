import type { ItemCategory, SortOption } from "../types";

interface FiltersProps {
  search: string;
  category: ItemCategory | "All";
  categories: ItemCategory[];
  sortBy: SortOption;
  title?: string;
  description?: string;
  hideCategory?: boolean;
  onSearchChange: (value: string) => void;
  onCategoryChange: (value: ItemCategory | "All") => void;
  onSortChange: (value: SortOption) => void;
}

export function Filters({
  search,
  category,
  categories,
  sortBy,
  title = "Explore Items",
  description = "Filter the current league snapshot, then drill into time-series history for any item.",
  hideCategory = false,
  onSearchChange,
  onCategoryChange,
  onSortChange,
}: FiltersProps) {
  return (
    <section className="panel filters-panel">
      <div className="panel-header">
        <h2>{title}</h2>
        <p>{description}</p>
      </div>

      <div className={hideCategory ? "filters-grid filters-grid-compact" : "filters-grid"}>
        <label className="field">
          <span>Search</span>
          <input
            type="search"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search for Divine Orb, Horned Scarab, Kaom's Heart..."
          />
        </label>

        {!hideCategory ? (
          <label className="field">
            <span>Category</span>
            <select
              value={category}
              onChange={(event) => onCategoryChange(event.target.value as ItemCategory | "All")}
            >
              <option value="All">All categories</option>
              {categories.map((itemCategory) => (
                <option key={itemCategory} value={itemCategory}>
                  {itemCategory}
                </option>
              ))}
            </select>
          </label>
        ) : null}

        <label className="field">
          <span>Sort By</span>
          <select value={sortBy} onChange={(event) => onSortChange(event.target.value as SortOption)}>
            <option value="price">Price</option>
            <option value="change7d">7-day change</option>
            <option value="change30d">30-day change</option>
            <option value="name">Name</option>
          </select>
        </label>
      </div>
    </section>
  );
}
