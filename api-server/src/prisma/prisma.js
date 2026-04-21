let userIdCounter = 1;
const mockUsers = [];
const mockProjects = [];
const mockBuilds = [];

export const prisma = {
  user: {
    findFirst: async () => mockUsers[0],
    findUnique: async ({ where }) => mockUsers.find(u => u.email === where.email),
    create: async ({ data }) => {
      const u = { ...data, id: `user-${userIdCounter++}` };
      mockUsers.push(u);
      return u;
    }
  },
  project: {
    create: async ({ data }) => {
      const p = { ...data, id: `proj-${Date.now()}` };
      mockProjects.push(p);
      return p;
    }
  },
  build: {
    create: async ({ data }) => {
      const b = { ...data, id: `build-${Date.now()}` };
      mockBuilds.push(b);
      return b;
    },
    update: async ({ where, data }) => {
      const b = mockBuilds.find(build => build.id === where.id);
      if (b) Object.assign(b, data);
      return b;
    },
    findUnique: async ({ where }) => {
      return mockBuilds.find(b => b.id === where.id) || { project: { slug: 'mock-slug', id: 'p-1' } };
    }
  },
  deployment: {
    create: async ({ data }) => data
  }
};
