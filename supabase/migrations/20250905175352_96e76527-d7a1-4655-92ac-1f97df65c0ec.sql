-- Fix test restaurant data and create test categories/items

-- Update the existing test restaurant name  
UPDATE public.tenants 
SET name = 'مطعم التجربة'
WHERE slug = 'test-restaurant';

-- Add test categories if they don't exist
INSERT INTO public.menu_categories (tenant_id, name, display_order, is_active)
SELECT 
    t.id,
    'المشاوي' as name,
    0 as display_order,
    true as is_active
FROM public.tenants t
WHERE t.slug = 'test-restaurant'
AND NOT EXISTS (
    SELECT 1 FROM public.menu_categories mc 
    WHERE mc.tenant_id = t.id AND mc.name = 'المشاوي'
);

INSERT INTO public.menu_categories (tenant_id, name, display_order, is_active)
SELECT 
    t.id,
    'المقبلات' as name,
    1 as display_order,
    true as is_active
FROM public.tenants t
WHERE t.slug = 'test-restaurant'
AND NOT EXISTS (
    SELECT 1 FROM public.menu_categories mc 
    WHERE mc.tenant_id = t.id AND mc.name = 'المقبلات'
);

-- Add test menu items if they don't exist
INSERT INTO public.menu_items (tenant_id, category_id, name, description, price, display_order, is_available)
SELECT 
    t.id,
    mc.id,
    'شيش طاووق' as name,
    'دجاج مشوي مع الخضار والأرز' as description,
    50000 as price,
    0 as display_order,
    true as is_available
FROM public.tenants t
JOIN public.menu_categories mc ON mc.tenant_id = t.id
WHERE t.slug = 'test-restaurant' AND mc.name = 'المشاوي'
AND NOT EXISTS (
    SELECT 1 FROM public.menu_items mi 
    WHERE mi.tenant_id = t.id AND mi.name = 'شيش طاووق'
);

INSERT INTO public.menu_items (tenant_id, category_id, name, description, price, display_order, is_available)
SELECT 
    t.id,
    mc.id,
    'حمص وفتوش' as name,
    'حمص طازج وسلطة فتوش لذيذة' as description,
    25000 as price,
    0 as display_order,
    true as is_available
FROM public.tenants t
JOIN public.menu_categories mc ON mc.tenant_id = t.id
WHERE t.slug = 'test-restaurant' AND mc.name = 'المقبلات'
AND NOT EXISTS (
    SELECT 1 FROM public.menu_items mi 
    WHERE mi.tenant_id = t.id AND mi.name = 'حمص وفتوش'
);