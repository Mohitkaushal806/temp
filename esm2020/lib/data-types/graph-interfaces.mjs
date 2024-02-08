export var GraphTypes;
(function (GraphTypes) {
    GraphTypes["BAR"] = "bar";
    GraphTypes["LINE"] = "line";
    GraphTypes["AREA"] = "area";
    GraphTypes["COLUMN"] = "column";
    GraphTypes["PIE"] = "pie";
    GraphTypes["STACKED_COLUMN"] = "stacked-column";
    GraphTypes["STACKED_COLUMN_PERCENTAGE"] = "stacked-column%";
    GraphTypes["STACKED_BAR"] = "stacked-bar";
    GraphTypes["STACKED_BAR_PERCENTAGE"] = "stacked-bar%";
    GraphTypes["SCATTER"] = "scatter";
    GraphTypes["SPLINE"] = "spline";
})(GraphTypes || (GraphTypes = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ3JhcGgtaW50ZXJmYWNlcy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL3Byb2plY3RzL3gtc2lnaHRzLWNvcmUvc3JjL2xpYi9kYXRhLXR5cGVzL2dyYXBoLWludGVyZmFjZXMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBa0NBLE1BQU0sQ0FBTixJQUFZLFVBWVg7QUFaRCxXQUFZLFVBQVU7SUFDbEIseUJBQVUsQ0FBQTtJQUNWLDJCQUFZLENBQUE7SUFDWiwyQkFBWSxDQUFBO0lBQ1osK0JBQWdCLENBQUE7SUFDaEIseUJBQVUsQ0FBQTtJQUNWLCtDQUFnQyxDQUFBO0lBQ2hDLDJEQUE0QyxDQUFBO0lBQzVDLHlDQUEwQixDQUFBO0lBQzFCLHFEQUFzQyxDQUFBO0lBQ3RDLGlDQUFrQixDQUFBO0lBQ2xCLCtCQUFnQixDQUFBO0FBQ3BCLENBQUMsRUFaVyxVQUFVLEtBQVYsVUFBVSxRQVlyQiIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IENvbXBvbmVudCB9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHtBZ2dyZWdhdGlvbkZ1bmN0aW9ufSBmcm9tICcuL2FnZ3JlZ2F0aW9uLWludGVyZmFjZXMnO1xuaW1wb3J0IHsgRGVyaXZlZFZhcmlhYmxlIH0gZnJvbSAnLi9kZXJpdmVkLXZhcmlhYmxlLWludGVyZmFjZXMnO1xuaW1wb3J0IHtGaWx0ZXJzfSBmcm9tIFwiLi9maWx0ZXItaW50ZXJmYWNlc1wiO1xuaW1wb3J0IHsgRGF0YUZvcm1hdCB9IGZyb20gJy4vdmFyaWFibGUtdHlwZXMnO1xuaW1wb3J0IHsgVHJlbmRzUmFuZ2UgfSBmcm9tICcuL3RyZW5kLWludGVyZmFjZXMnO1xuXG5leHBvcnQgaW50ZXJmYWNlIEdyYXBoRGF0YSB7XG4gICAgZ3JhcGhJZDogc3RyaW5nO1xuICAgIGdyYXBoVGl0bGU6IHN0cmluZztcbiAgICByb3dzOiBzdHJpbmdbXTtcbiAgICBjb2x1bW5zOiBzdHJpbmdbXTtcbiAgICBjdXJyTGV2ZWw/OiBhbnk7XG4gICAgZ3JhcGhUeXBlczogR3JhcGhUeXBlc1tdO1xuICAgIGdyYXBoRGF0YTogYW55O1xuICAgIHByZXZMZXZlbERhdGE/OiBhbnk7XG4gICAgYWRtaW5JZD86IGFueTtcbiAgICBhZ2dyZWdhdGlvbkZ1bmN0aW9uczogQWdncmVnYXRpb25GdW5jdGlvbltdO1xuICAgIGZpbHRlcjogRmlsdGVycztcbiAgICBzZWxLZXlzPzogc3RyaW5nW107XG4gICAgcmFuZ2U/OiBUcmVuZHNSYW5nZTtcbiAgICBjb2xvcnM6IHN0cmluZ1tdO1xuICAgIG9yZGVyPzogYW55O1xuICAgIGN1c3RvbVZhcmlhYmxlOiBEZXJpdmVkVmFyaWFibGVbXTtcbiAgICBkYXRhRm9ybWF0OiBEYXRhRm9ybWF0W107XG4gICAgY29sVG9TaG93Pzogc3RyaW5nO1xuICAgIGxhc3RMZXZlbENvbHVtbnM6IHN0cmluZ1tdO1xuICAgIHNvdXJjZUlkPzogYW55O1xuICAgIGRhc2hib2FyZEZpbHRlcj86IGFueTtcbiAgICBzaGFyZWlkPzogYW55O1xuICAgIGJyZWFkQ3J1bWI/OiBhbnk7XG59IFxuXG5cbmV4cG9ydCBlbnVtIEdyYXBoVHlwZXMge1xuICAgIEJBUj0gJ2JhcicsXG4gICAgTElORT0gJ2xpbmUnLFxuICAgIEFSRUE9ICdhcmVhJyxcbiAgICBDT0xVTU49ICdjb2x1bW4nLFxuICAgIFBJRT0gJ3BpZScsXG4gICAgU1RBQ0tFRF9DT0xVTU49ICdzdGFja2VkLWNvbHVtbicsXG4gICAgU1RBQ0tFRF9DT0xVTU5fUEVSQ0VOVEFHRT0gJ3N0YWNrZWQtY29sdW1uJScsXG4gICAgU1RBQ0tFRF9CQVI9ICdzdGFja2VkLWJhcicsXG4gICAgU1RBQ0tFRF9CQVJfUEVSQ0VOVEFHRT0gJ3N0YWNrZWQtYmFyJScsXG4gICAgU0NBVFRFUj0gJ3NjYXR0ZXInLFxuICAgIFNQTElORT0gJ3NwbGluZScsXG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgR3JhcGhMaXN0IHtcbiAgICBba2V5OiBzdHJpbmddOiBHcmFwaERhdGE7XG59Il19