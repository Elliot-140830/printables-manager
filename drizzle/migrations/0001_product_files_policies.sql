CREATE POLICY "Inloggade läser produktfiler" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'product-files');
CREATE POLICY "Inloggade laddar upp produktfiler" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'product-files');
CREATE POLICY "Inloggade uppdaterar produktfiler" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'product-files');
CREATE POLICY "Inloggade tar bort produktfiler" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'product-files');