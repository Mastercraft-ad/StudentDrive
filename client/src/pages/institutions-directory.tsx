import { useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { Link } from "wouter";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Building2,
  Search,
  Star,
  MapPin,
  Globe,
  Users,
  Calendar,
  Mail,
  Phone,
} from "lucide-react";
import type { Institution } from "@shared/schema";

export default function InstitutionsDirectory() {
  const [searchQuery, setSearchQuery] = useState("");
  const [countryFilter, setCountryFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("rating");

  const { data: institutions, isLoading } = useQuery<Institution[]>({
    queryKey: ["/api/institutions"],
  });

  const countries = useMemo(() => {
    if (!institutions) return [];
    const uniqueCountries = new Set(
      institutions.map((inst) => inst.country).filter(Boolean)
    );
    return Array.from(uniqueCountries).sort();
  }, [institutions]);

  const types = useMemo(() => {
    if (!institutions) return [];
    const uniqueTypes = new Set(
      institutions.map((inst) => inst.type).filter(Boolean)
    );
    return Array.from(uniqueTypes).sort();
  }, [institutions]);

  const filteredInstitutions = useMemo(() => {
    if (!institutions) return [];

    let filtered = institutions.filter((inst) => {
      const matchesSearch =
        searchQuery === "" ||
        inst.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inst.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inst.city?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCountry =
        countryFilter === "all" || inst.country === countryFilter;

      const matchesType = typeFilter === "all" || inst.type === typeFilter;

      return matchesSearch && matchesCountry && matchesType;
    });

    // Sort
    if (sortBy === "rating") {
      filtered.sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0));
    } else if (sortBy === "name") {
      filtered.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === "reviews") {
      filtered.sort((a, b) => (b.totalReviews || 0) - (a.totalReviews || 0));
    } else if (sortBy === "students") {
      filtered.sort((a, b) => (b.studentCount || 0) - (a.studentCount || 0));
    }

    return filtered;
  }, [institutions, searchQuery, countryFilter, typeFilter, sortBy]);

  return (
    <div className="min-h-screen bg-background">
      <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <Building2 className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1
                className="text-section font-heading text-foreground"
                data-testid="text-page-title"
              >
                Institutions Directory
              </h1>
              <p className="text-muted-foreground" data-testid="text-page-subtitle">
                Explore and review educational institutions
              </p>
            </div>
          </div>

          {/* Search and Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                <div className="lg:col-span-2 relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    data-testid="input-search-institutions"
                    placeholder="Search institutions..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>

                <Select value={countryFilter} onValueChange={setCountryFilter}>
                  <SelectTrigger data-testid="select-country-filter">
                    <SelectValue placeholder="Country" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Countries</SelectItem>
                    {countries.map((country) => (
                      <SelectItem key={country} value={country!}>
                        {country}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger data-testid="select-type-filter">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {types.map((type) => (
                      <SelectItem key={type} value={type!}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger data-testid="select-sort-by">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rating">Highest Rated</SelectItem>
                    <SelectItem value="reviews">Most Reviews</SelectItem>
                    <SelectItem value="name">Name (A-Z)</SelectItem>
                    <SelectItem value="students">Student Count</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground" data-testid="text-results-count">
              {isLoading
                ? "Loading..."
                : `${filteredInstitutions.length} institution${filteredInstitutions.length !== 1 ? "s" : ""} found`}
            </p>
          </div>
        </div>

        {/* Institutions Grid */}
        {isLoading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-full" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-20 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredInstitutions.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                No institutions found
              </h3>
              <p className="text-muted-foreground">
                Try adjusting your search or filter criteria
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredInstitutions.map((institution) => (
              <Card
                key={institution.id}
                className="hover:shadow-lg transition-shadow"
                data-testid={`card-institution-${institution.id}`}
              >
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="line-clamp-1" data-testid={`text-institution-name-${institution.id}`}>
                        {institution.name}
                      </CardTitle>
                      {institution.type && (
                        <Badge variant="secondary" className="mt-2">
                          {institution.type}
                        </Badge>
                      )}
                    </div>
                    {institution.averageRating && institution.averageRating > 0 ? (
                      <div
                        className="flex items-center gap-1 bg-yellow-50 dark:bg-yellow-900/20 px-2 py-1 rounded-md"
                        data-testid={`rating-${institution.id}`}
                      >
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-semibold text-sm">
                          {institution.averageRating.toFixed(1)}
                        </span>
                      </div>
                    ) : null}
                  </div>

                  {institution.description && (
                    <CardDescription className="line-clamp-2 mt-2">
                      {institution.description}
                    </CardDescription>
                  )}
                </CardHeader>

                <CardContent className="space-y-3">
                  {institution.city && institution.country && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4 flex-shrink-0" />
                      <span className="truncate">
                        {institution.city}, {institution.country}
                      </span>
                    </div>
                  )}

                  {institution.studentCount && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Users className="h-4 w-4 flex-shrink-0" />
                      <span>
                        {institution.studentCount.toLocaleString()} students
                      </span>
                    </div>
                  )}

                  {institution.founded && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4 flex-shrink-0" />
                      <span>Founded {institution.founded}</span>
                    </div>
                  )}

                  {institution.website && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Globe className="h-4 w-4 flex-shrink-0" />
                      <a
                        href={institution.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline truncate"
                        data-testid={`link-website-${institution.id}`}
                      >
                        Visit Website
                      </a>
                    </div>
                  )}

                  <div className="flex items-center gap-2 pt-2">
                    {institution.totalReviews && institution.totalReviews > 0 ? (
                      <span
                        className="text-sm text-muted-foreground"
                        data-testid={`text-review-count-${institution.id}`}
                      >
                        {institution.totalReviews} review{institution.totalReviews !== 1 ? "s" : ""}
                      </span>
                    ) : (
                      <span className="text-sm text-muted-foreground">
                        No reviews yet
                      </span>
                    )}
                  </div>

                  <Link href={`/institutions/${institution.profileSlug}`}>
                    <Button
                      className="w-full mt-2"
                      variant="outline"
                      data-testid={`button-view-institution-${institution.id}`}
                    >
                      View Details & Reviews
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
